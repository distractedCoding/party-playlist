import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';

interface Client {
  ws: WebSocket;
  partyId: number;
  sessionId: string;
}

const clients: Map<WebSocket, Client> = new Map();
const partyClients: Map<number, Set<WebSocket>> = new Map();

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        handleMessage(ws, message);
      } catch (e) {
        console.error('Invalid WebSocket message:', e);
      }
    });

    ws.on('close', () => {
      const client = clients.get(ws);
      if (client) {
        const partySet = partyClients.get(client.partyId);
        if (partySet) {
          partySet.delete(ws);
          if (partySet.size === 0) {
            partyClients.delete(client.partyId);
          }
        }
        clients.delete(ws);
        
        // Notify others that someone left
        broadcastToParty(client.partyId, {
          type: 'user_left',
          sessionId: client.sessionId,
          count: partyClients.get(client.partyId)?.size || 0,
        });
      }
      console.log('WebSocket client disconnected');
    });

    ws.on('error', (err) => {
      console.error('WebSocket error:', err);
    });
  });

  return wss;
}

function handleMessage(ws: WebSocket, message: any) {
  switch (message.type) {
    case 'join':
      // Join a party room
      const { partyId, sessionId } = message;
      
      if (!partyId || !sessionId) {
        ws.send(JSON.stringify({ type: 'error', message: 'partyId and sessionId required' }));
        return;
      }

      // Store client info
      clients.set(ws, { ws, partyId, sessionId });

      // Add to party room
      if (!partyClients.has(partyId)) {
        partyClients.set(partyId, new Set());
      }
      partyClients.get(partyId)!.add(ws);

      // Confirm join
      ws.send(JSON.stringify({ type: 'joined', partyId }));

      // Notify others
      broadcastToParty(partyId, {
        type: 'user_joined',
        sessionId,
        count: partyClients.get(partyId)!.size,
      }, ws);
      break;

    case 'ping':
      ws.send(JSON.stringify({ type: 'pong' }));
      break;

    default:
      console.log('Unknown message type:', message.type);
  }
}

export function broadcastToParty(partyId: number, message: any, exclude?: WebSocket) {
  const party = partyClients.get(partyId);
  if (!party) return;

  const data = JSON.stringify(message);
  for (const client of party) {
    if (client !== exclude && client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

export function getPartyUserCount(partyId: number): number {
  return partyClients.get(partyId)?.size || 0;
}

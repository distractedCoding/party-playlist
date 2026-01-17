import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { createServer } from 'http';

import partyRoutes from './routes/party.js';
import spotifyRoutes from './routes/spotify.js';
import queueRoutes from './routes/queue.js';
import { setupWebSocket } from './websocket.js';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// API routes
app.route('/api/party', partyRoutes);
app.route('/api/spotify', spotifyRoutes);
app.route('/api/queue', queueRoutes);

// 404 handler
app.notFound((c) => c.json({ error: 'Not found' }, 404));

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

// Create HTTP server and attach WebSocket
const port = parseInt(process.env.PORT || '3000');

const server = createServer(serve({ fetch: app.fetch, port }).server);

// Setup WebSocket on the same server
setupWebSocket(server);

server.listen(port, () => {
  console.log(`🎉 Party Playlist server running on http://localhost:${port}`);
  console.log(`📡 WebSocket available at ws://localhost:${port}/ws`);
});

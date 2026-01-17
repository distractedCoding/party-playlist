import { Hono } from 'hono';
import { db, schema } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { broadcastToParty } from '../websocket.js';

const app = new Hono();

// Generate a random 6-character party code
function generatePartyCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Create a new party
app.post('/create', async (c) => {
  const { hostId } = await c.req.json();
  
  if (!hostId) {
    return c.json({ error: 'hostId is required' }, 400);
  }

  let code = generatePartyCode();
  
  // Ensure unique code
  let existing = await db.query.parties.findFirst({
    where: eq(schema.parties.code, code)
  });
  while (existing) {
    code = generatePartyCode();
    existing = await db.query.parties.findFirst({
      where: eq(schema.parties.code, code)
    });
  }

  const [party] = await db.insert(schema.parties).values({
    code,
    hostId,
  }).returning();

  return c.json({ party });
});

// Join an existing party by code
app.post('/join', async (c) => {
  const { code } = await c.req.json();
  
  if (!code) {
    return c.json({ error: 'code is required' }, 400);
  }

  const party = await db.query.parties.findFirst({
    where: eq(schema.parties.code, code.toUpperCase())
  });

  if (!party) {
    return c.json({ error: 'Party not found' }, 404);
  }

  return c.json({ party: { id: party.id, code: party.code } });
});

// Get party details
app.get('/:code', async (c) => {
  const code = c.req.param('code');
  
  const party = await db.query.parties.findFirst({
    where: eq(schema.parties.code, code.toUpperCase())
  });

  if (!party) {
    return c.json({ error: 'Party not found' }, 404);
  }

  // Don't expose tokens
  return c.json({
    party: {
      id: party.id,
      code: party.code,
      hostId: party.hostId,
      hasSpotify: !!party.spotifyAccessToken,
      createdAt: party.createdAt
    }
  });
});

// Delete a party (host only)
app.delete('/:code', async (c) => {
  const code = c.req.param('code');
  const { hostId } = await c.req.json();

  const party = await db.query.parties.findFirst({
    where: eq(schema.parties.code, code.toUpperCase())
  });

  if (!party) {
    return c.json({ error: 'Party not found' }, 404);
  }

  if (party.hostId !== hostId) {
    return c.json({ error: 'Only the host can delete the party' }, 403);
  }

  // Delete votes for all songs in this party
  const songs = await db.query.songs.findMany({
    where: eq(schema.songs.partyId, party.id)
  });
  
  for (const song of songs) {
    await db.delete(schema.votes).where(eq(schema.votes.songId, song.id));
  }

  // Delete songs
  await db.delete(schema.songs).where(eq(schema.songs.partyId, party.id));
  
  // Delete party
  await db.delete(schema.parties).where(eq(schema.parties.id, party.id));

  broadcastToParty(party.id, { type: 'party_deleted' });

  return c.json({ success: true });
});

export default app;

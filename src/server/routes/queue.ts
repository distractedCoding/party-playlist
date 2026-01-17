import { Hono } from 'hono';
import { db, schema } from '../db/index.js';
import { eq, and, desc } from 'drizzle-orm';
import { broadcastToParty } from '../websocket.js';

const app = new Hono();

// Get queue for a party
app.get('/:partyId', async (c) => {
  const partyId = parseInt(c.req.param('partyId'));

  const songs = await db.query.songs.findMany({
    where: and(
      eq(schema.songs.partyId, partyId),
      eq(schema.songs.played, false)
    ),
    orderBy: [desc(schema.songs.votes), schema.songs.queuedAt],
  });

  return c.json({ queue: songs });
});

// Add song to queue
app.post('/add', async (c) => {
  const { partyId, spotifyUri, title, artist, albumArt, sessionId } = await c.req.json();

  if (!partyId || !spotifyUri || !title || !artist) {
    return c.json({ error: 'Missing required fields' }, 400);
  }

  // Check if song already in queue
  const existing = await db.query.songs.findFirst({
    where: and(
      eq(schema.songs.partyId, partyId),
      eq(schema.songs.spotifyUri, spotifyUri),
      eq(schema.songs.played, false)
    )
  });

  if (existing) {
    return c.json({ error: 'Song already in queue', song: existing }, 409);
  }

  const [song] = await db.insert(schema.songs).values({
    partyId,
    spotifyUri,
    title,
    artist,
    albumArt,
    votes: 1, // Auto-upvote when adding
  }).returning();

  // Auto-vote for the person who added it
  if (sessionId) {
    await db.insert(schema.votes).values({
      songId: song.id,
      sessionId,
    }).onConflictDoNothing();
  }

  // Broadcast queue update
  broadcastToParty(partyId, {
    type: 'queue_update',
    song,
  });

  return c.json({ song });
});

// Vote for a song
app.post('/vote', async (c) => {
  const { songId, sessionId, upvote = true } = await c.req.json();

  if (!songId || !sessionId) {
    return c.json({ error: 'songId and sessionId required' }, 400);
  }

  const song = await db.query.songs.findFirst({
    where: eq(schema.songs.id, songId)
  });

  if (!song) {
    return c.json({ error: 'Song not found' }, 404);
  }

  // Check if already voted
  const existingVote = await db.query.votes.findFirst({
    where: and(
      eq(schema.votes.songId, songId),
      eq(schema.votes.sessionId, sessionId)
    )
  });

  if (upvote) {
    if (existingVote) {
      return c.json({ error: 'Already voted for this song' }, 409);
    }

    // Add vote
    await db.insert(schema.votes).values({ songId, sessionId });
    await db.update(schema.songs)
      .set({ votes: song.votes + 1 })
      .where(eq(schema.songs.id, songId));
  } else {
    if (!existingVote) {
      return c.json({ error: 'No vote to remove' }, 400);
    }

    // Remove vote
    await db.delete(schema.votes)
      .where(and(
        eq(schema.votes.songId, songId),
        eq(schema.votes.sessionId, sessionId)
      ));
    await db.update(schema.songs)
      .set({ votes: Math.max(0, song.votes - 1) })
      .where(eq(schema.songs.id, songId));
  }

  // Get updated song
  const updatedSong = await db.query.songs.findFirst({
    where: eq(schema.songs.id, songId)
  });

  // Broadcast vote update
  broadcastToParty(song.partyId, {
    type: 'vote_update',
    song: updatedSong,
  });

  return c.json({ song: updatedSong });
});

// Mark song as played
app.post('/played', async (c) => {
  const { songId } = await c.req.json();

  const song = await db.query.songs.findFirst({
    where: eq(schema.songs.id, songId)
  });

  if (!song) {
    return c.json({ error: 'Song not found' }, 404);
  }

  await db.update(schema.songs)
    .set({ played: true })
    .where(eq(schema.songs.id, songId));

  // Broadcast update
  broadcastToParty(song.partyId, {
    type: 'song_played',
    songId,
  });

  return c.json({ success: true });
});

// Remove song from queue (host only or own songs)
app.delete('/:songId', async (c) => {
  const songId = parseInt(c.req.param('songId'));
  const { sessionId, hostId } = await c.req.json();

  const song = await db.query.songs.findFirst({
    where: eq(schema.songs.id, songId)
  });

  if (!song) {
    return c.json({ error: 'Song not found' }, 404);
  }

  const party = await db.query.parties.findFirst({
    where: eq(schema.parties.id, song.partyId)
  });

  // Allow host to remove any song
  const isHost = party?.hostId === hostId;
  
  if (!isHost) {
    return c.json({ error: 'Only the host can remove songs' }, 403);
  }

  // Delete votes first
  await db.delete(schema.votes).where(eq(schema.votes.songId, songId));
  
  // Delete song
  await db.delete(schema.songs).where(eq(schema.songs.id, songId));

  // Broadcast update
  broadcastToParty(song.partyId, {
    type: 'song_removed',
    songId,
  });

  return c.json({ success: true });
});

// Get next song to play (highest votes)
app.get('/next/:partyId', async (c) => {
  const partyId = parseInt(c.req.param('partyId'));

  const songs = await db.query.songs.findMany({
    where: and(
      eq(schema.songs.partyId, partyId),
      eq(schema.songs.played, false)
    ),
    orderBy: [desc(schema.songs.votes), schema.songs.queuedAt],
    limit: 1,
  });

  if (songs.length === 0) {
    return c.json({ next: null });
  }

  return c.json({ next: songs[0] });
});

export default app;

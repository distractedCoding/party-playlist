import { Hono } from 'hono';
import { db, schema } from '../db/index.js';
import { eq } from 'drizzle-orm';

const app = new Hono();

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || '';
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || '';
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/callback';

const SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'playlist-modify-public',
  'playlist-modify-private',
].join(' ');

// Start OAuth flow
app.get('/auth', (c) => {
  const partyCode = c.req.query('partyCode');
  const state = partyCode || 'noparty';
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: SPOTIFY_CLIENT_ID,
    scope: SCOPES,
    redirect_uri: SPOTIFY_REDIRECT_URI,
    state,
  });

  return c.redirect(`https://accounts.spotify.com/authorize?${params}`);
});

// OAuth callback
app.get('/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');
  const error = c.req.query('error');

  if (error) {
    return c.json({ error: 'Spotify authorization failed' }, 400);
  }

  if (!code) {
    return c.json({ error: 'No authorization code received' }, 400);
  }

  // Exchange code for tokens
  const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: SPOTIFY_REDIRECT_URI,
    }),
  });

  const tokens = await tokenResponse.json();

  if (!tokenResponse.ok) {
    return c.json({ error: 'Failed to get tokens', details: tokens }, 400);
  }

  // If we have a party code, save tokens to party
  if (state && state !== 'noparty') {
    const party = await db.query.parties.findFirst({
      where: eq(schema.parties.code, state.toUpperCase())
    });

    if (party) {
      await db.update(schema.parties)
        .set({
          spotifyAccessToken: tokens.access_token,
          spotifyRefreshToken: tokens.refresh_token,
          spotifyTokenExpiry: Date.now() + (tokens.expires_in * 1000),
        })
        .where(eq(schema.parties.id, party.id));
    }
  }

  // Redirect back to frontend
  return c.redirect(`/?spotify=connected&partyCode=${state}`);
});

// Refresh access token
async function refreshAccessToken(partyId: number): Promise<string | null> {
  const party = await db.query.parties.findFirst({
    where: eq(schema.parties.id, partyId)
  });

  if (!party?.spotifyRefreshToken) return null;

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: party.spotifyRefreshToken,
    }),
  });

  const tokens = await response.json();

  if (!response.ok) return null;

  await db.update(schema.parties)
    .set({
      spotifyAccessToken: tokens.access_token,
      spotifyTokenExpiry: Date.now() + (tokens.expires_in * 1000),
    })
    .where(eq(schema.parties.id, partyId));

  return tokens.access_token;
}

// Get valid access token for party
async function getAccessToken(partyId: number): Promise<string | null> {
  const party = await db.query.parties.findFirst({
    where: eq(schema.parties.id, partyId)
  });

  if (!party?.spotifyAccessToken) return null;

  // Refresh if expired or expiring soon
  if (party.spotifyTokenExpiry && party.spotifyTokenExpiry < Date.now() + 60000) {
    return refreshAccessToken(partyId);
  }

  return party.spotifyAccessToken;
}

// Search for tracks
app.get('/search', async (c) => {
  const query = c.req.query('q');
  const partyId = parseInt(c.req.query('partyId') || '0');

  if (!query) {
    return c.json({ error: 'Query required' }, 400);
  }

  const accessToken = await getAccessToken(partyId);
  if (!accessToken) {
    return c.json({ error: 'Party not connected to Spotify' }, 401);
  }

  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
    {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    return c.json({ error: 'Spotify search failed', details: data }, response.status);
  }

  const tracks = data.tracks.items.map((track: any) => ({
    uri: track.uri,
    title: track.name,
    artist: track.artists.map((a: any) => a.name).join(', '),
    albumArt: track.album.images[0]?.url,
    duration: track.duration_ms,
  }));

  return c.json({ tracks });
});

// Get current playback state
app.get('/playback', async (c) => {
  const partyId = parseInt(c.req.query('partyId') || '0');

  const accessToken = await getAccessToken(partyId);
  if (!accessToken) {
    return c.json({ error: 'Party not connected to Spotify' }, 401);
  }

  const response = await fetch('https://api.spotify.com/v1/me/player', {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  if (response.status === 204) {
    return c.json({ playing: false, track: null });
  }

  const data = await response.json();

  if (!response.ok) {
    return c.json({ error: 'Failed to get playback', details: data }, response.status);
  }

  return c.json({
    playing: data.is_playing,
    track: data.item ? {
      uri: data.item.uri,
      title: data.item.name,
      artist: data.item.artists.map((a: any) => a.name).join(', '),
      albumArt: data.item.album.images[0]?.url,
      progress: data.progress_ms,
      duration: data.item.duration_ms,
    } : null,
  });
});

// Play a track
app.post('/play', async (c) => {
  const { partyId, uri } = await c.req.json();

  const accessToken = await getAccessToken(partyId);
  if (!accessToken) {
    return c.json({ error: 'Party not connected to Spotify' }, 401);
  }

  const response = await fetch('https://api.spotify.com/v1/me/player/play', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ uris: [uri] }),
  });

  if (response.status === 204 || response.ok) {
    return c.json({ success: true });
  }

  const data = await response.json();
  return c.json({ error: 'Failed to play track', details: data }, response.status);
});

// Pause playback
app.post('/pause', async (c) => {
  const { partyId } = await c.req.json();

  const accessToken = await getAccessToken(partyId);
  if (!accessToken) {
    return c.json({ error: 'Party not connected to Spotify' }, 401);
  }

  const response = await fetch('https://api.spotify.com/v1/me/player/pause', {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  if (response.status === 204 || response.ok) {
    return c.json({ success: true });
  }

  const data = await response.json();
  return c.json({ error: 'Failed to pause', details: data }, response.status);
});

// Skip to next track
app.post('/skip', async (c) => {
  const { partyId } = await c.req.json();

  const accessToken = await getAccessToken(partyId);
  if (!accessToken) {
    return c.json({ error: 'Party not connected to Spotify' }, 401);
  }

  const response = await fetch('https://api.spotify.com/v1/me/player/next', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  if (response.status === 204 || response.ok) {
    return c.json({ success: true });
  }

  const data = await response.json();
  return c.json({ error: 'Failed to skip', details: data }, response.status);
});

export default app;

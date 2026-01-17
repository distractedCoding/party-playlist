# CLAUDE.md - Party Playlist Project

## Overview

A collaborative Spotify party playlist where guests can vote and queue songs.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   React     │────▶│   Hono      │────▶│  Spotify    │
│   Frontend  │◀────│   Backend   │◀────│  API        │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │
       └───── WebSocket ───┘
```

## Key Files

- `src/server/index.ts` - Main server entry
- `src/server/routes/party.ts` - Party CRUD
- `src/server/routes/spotify.ts` - Spotify integration
- `src/server/websocket.ts` - Real-time updates
- `src/client/App.tsx` - React app entry
- `src/client/pages/Party.tsx` - Main party view

## Spotify Scopes Needed

```
user-read-playback-state
user-modify-playback-state
user-read-currently-playing
playlist-modify-public
playlist-modify-private
```

## Database Schema

```sql
parties: id, code, host_id, spotify_token, created_at
songs: id, party_id, spotify_uri, title, artist, votes, queued_at
votes: id, song_id, session_id
```

## Environment Variables

```
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REDIRECT_URI=http://localhost:3000/callback
SESSION_SECRET=random-secret-here
```

## Development Commands

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run start    # Start production server
```

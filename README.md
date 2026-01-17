# 🎵 Party Playlist

Collaborative Spotify party playlist controller - vote and queue songs together!

## Features

- 🎉 **Create Party** - Host starts a party session
- 🔗 **Join via Link** - Guests join with party code
- 🔍 **Search Songs** - Search Spotify's catalog
- 👍 **Vote for Songs** - Democracy decides the playlist
- 📋 **Queue Songs** - Add songs to the queue
- ⏯️ **Host Controls** - Play, pause, skip
- 🔄 **Real-time Updates** - See votes and queue live

## Tech Stack

- **Frontend:** React + Vite + TailwindCSS
- **Backend:** Hono + Node.js
- **Database:** SQLite + Drizzle ORM
- **Real-time:** WebSockets
- **Auth:** Spotify OAuth 2.0
- **API:** Spotify Web API

## Getting Started

### Prerequisites

- Node.js 20+
- Spotify Developer Account
- Spotify Premium (for playback control)

### Setup

```bash
# Clone
git clone https://github.com/distractedCoding/party-playlist.git
cd party-playlist

# Install
npm install

# Configure
cp .env.example .env
# Add your Spotify credentials

# Run
npm run dev
```

### Spotify App Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create new app
3. Add redirect URI: `http://localhost:3000/callback`
4. Copy Client ID and Client Secret to `.env`

## Project Structure

```
party-playlist/
├── src/
│   ├── client/          # React frontend
│   │   ├── components/
│   │   ├── pages/
│   │   └── hooks/
│   ├── server/          # Hono backend
│   │   ├── routes/
│   │   ├── spotify/
│   │   └── websocket/
│   └── shared/          # Shared types
├── public/
└── package.json
```

## API Endpoints

- `POST /api/party` - Create party
- `GET /api/party/:code` - Join party
- `GET /api/search?q=` - Search songs
- `POST /api/queue` - Add to queue
- `POST /api/vote/:songId` - Vote for song
- `WS /ws/:partyCode` - Real-time updates

## License

MIT

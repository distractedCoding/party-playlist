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
# Clone the repository
git clone https://github.com/distractedCoding/party-playlist.git
cd party-playlist

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

Edit `.env` with your Spotify credentials:

```env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
SPOTIFY_REDIRECT_URI=http://localhost:3000/callback
SESSION_SECRET=your_random_session_secret
```

```bash
# Initialize the database
npm run db:push

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`.

### Spotify App Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click **Create App**
3. Fill in the app details:
   - App name: Party Playlist (or your choice)
   - App description: Collaborative party playlist
   - Redirect URI: `http://localhost:3000/callback`
4. Accept the terms and create the app
5. Go to **Settings** and copy your **Client ID** and **Client Secret**
6. Add them to your `.env` file

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (frontend + backend) |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run db:push` | Push schema changes to database |
| `npm run db:studio` | Open Drizzle Studio (database GUI) |

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

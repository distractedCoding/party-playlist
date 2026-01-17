import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';

const sqlite = new Database('party-playlist.db');

// Enable WAL mode for better performance
sqlite.pragma('journal_mode = WAL');

// Create tables if they don't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS parties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    host_id TEXT NOT NULL,
    spotify_access_token TEXT,
    spotify_refresh_token TEXT,
    spotify_token_expiry INTEGER,
    created_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    party_id INTEGER NOT NULL REFERENCES parties(id),
    spotify_uri TEXT NOT NULL,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    album_art TEXT,
    votes INTEGER NOT NULL DEFAULT 0,
    played INTEGER NOT NULL DEFAULT 0,
    queued_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    song_id INTEGER NOT NULL REFERENCES songs(id),
    session_id TEXT NOT NULL,
    UNIQUE(song_id, session_id)
  );

  CREATE INDEX IF NOT EXISTS idx_songs_party ON songs(party_id);
  CREATE INDEX IF NOT EXISTS idx_votes_song ON votes(song_id);
`);

export const db = drizzle(sqlite, { schema });
export { schema };

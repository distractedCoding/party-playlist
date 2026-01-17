import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const parties = sqliteTable('parties', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  hostId: text('host_id').notNull(),
  spotifyAccessToken: text('spotify_access_token'),
  spotifyRefreshToken: text('spotify_refresh_token'),
  spotifyTokenExpiry: integer('spotify_token_expiry'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const songs = sqliteTable('songs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  partyId: integer('party_id').notNull().references(() => parties.id),
  spotifyUri: text('spotify_uri').notNull(),
  title: text('title').notNull(),
  artist: text('artist').notNull(),
  albumArt: text('album_art'),
  votes: integer('votes').notNull().default(0),
  played: integer('played', { mode: 'boolean' }).notNull().default(false),
  queuedAt: integer('queued_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const votes = sqliteTable('votes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  songId: integer('song_id').notNull().references(() => songs.id),
  sessionId: text('session_id').notNull(),
});

export type Party = typeof parties.$inferSelect;
export type Song = typeof songs.$inferSelect;
export type Vote = typeof votes.$inferSelect;

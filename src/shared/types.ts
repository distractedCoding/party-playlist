// ============================================
// Core Domain Types
// ============================================

export interface Party {
  id: number;
  code: string;
  hostId: string;
  spotifyAccessToken: string | null;
  spotifyRefreshToken: string | null;
  spotifyTokenExpiry: number | null;
  createdAt: Date | null;
}

export interface Song {
  id: number;
  partyId: number;
  spotifyUri: string;
  title: string;
  artist: string;
  albumArt: string | null;
  votes: number;
  played: boolean;
  queuedAt: Date | null;
}

export interface Vote {
  id: number;
  songId: number;
  sessionId: string;
}

export interface User {
  sessionId: string;
  partyId: number;
  isHost: boolean;
  joinedAt: Date;
}

// ============================================
// WebSocket Message Types
// ============================================

export type WebSocketMessageType =
  | 'join'
  | 'joined'
  | 'user_joined'
  | 'user_left'
  | 'queue_updated'
  | 'song_voted'
  | 'now_playing'
  | 'playback_state'
  | 'ping'
  | 'pong'
  | 'error';

export interface WSMessageBase {
  type: WebSocketMessageType;
}

export interface WSJoinMessage extends WSMessageBase {
  type: 'join';
  partyId: number;
  sessionId: string;
}

export interface WSJoinedMessage extends WSMessageBase {
  type: 'joined';
  partyId: number;
}

export interface WSUserJoinedMessage extends WSMessageBase {
  type: 'user_joined';
  sessionId: string;
  count: number;
}

export interface WSUserLeftMessage extends WSMessageBase {
  type: 'user_left';
  sessionId: string;
  count: number;
}

export interface WSQueueUpdatedMessage extends WSMessageBase {
  type: 'queue_updated';
  queue: Song[];
}

export interface WSSongVotedMessage extends WSMessageBase {
  type: 'song_voted';
  songId: number;
  votes: number;
}

export interface WSNowPlayingMessage extends WSMessageBase {
  type: 'now_playing';
  song: Song | null;
  isPlaying: boolean;
  progressMs: number;
  durationMs: number;
}

export interface WSPlaybackStateMessage extends WSMessageBase {
  type: 'playback_state';
  isPlaying: boolean;
  progressMs: number;
}

export interface WSPingMessage extends WSMessageBase {
  type: 'ping';
}

export interface WSPongMessage extends WSMessageBase {
  type: 'pong';
}

export interface WSErrorMessage extends WSMessageBase {
  type: 'error';
  message: string;
}

export type WebSocketMessage =
  | WSJoinMessage
  | WSJoinedMessage
  | WSUserJoinedMessage
  | WSUserLeftMessage
  | WSQueueUpdatedMessage
  | WSSongVotedMessage
  | WSNowPlayingMessage
  | WSPlaybackStateMessage
  | WSPingMessage
  | WSPongMessage
  | WSErrorMessage;

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CreatePartyResponse {
  party: Party;
  hostId: string;
}

export interface JoinPartyResponse {
  party: Party;
  queue: Song[];
  userCount: number;
}

export interface SearchResult {
  spotifyUri: string;
  title: string;
  artist: string;
  albumArt: string | null;
  durationMs: number;
}

export interface SearchResponse {
  results: SearchResult[];
}

export interface QueueSongRequest {
  partyCode: string;
  spotifyUri: string;
  title: string;
  artist: string;
  albumArt?: string;
}

export interface QueueSongResponse {
  song: Song;
}

export interface VoteResponse {
  songId: number;
  votes: number;
  voted: boolean;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentSong: Song | null;
  progressMs: number;
  durationMs: number;
}

// ============================================
// Spotify Types (subset we use)
// ============================================

export interface SpotifyTrack {
  uri: string;
  name: string;
  artists: { name: string }[];
  album: {
    images: { url: string; width: number; height: number }[];
  };
  duration_ms: number;
}

export interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[];
  };
}

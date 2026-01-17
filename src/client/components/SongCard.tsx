import { Song } from '../hooks/useParty'

interface SongCardProps {
  song: Song
  rank?: number
  onVote: (songId: string, direction: 'up' | 'down') => void
  showVoting?: boolean
}

export default function SongCard({ song, rank, onVote, showVoting = true }: SongCardProps) {
  return (
    <div className="group flex items-center gap-4 p-3 rounded-xl bg-spotify-gray/50 hover:bg-spotify-gray transition">
      {/* Rank */}
      {rank !== undefined && (
        <div className="w-8 text-center font-bold text-spotify-lightgray">
          {rank}
        </div>
      )}

      {/* Album Art */}
      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
        {song.albumArt ? (
          <img src={song.albumArt} alt={song.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-spotify-dark flex items-center justify-center text-xl">
            🎵
          </div>
        )}
      </div>

      {/* Song Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold truncate">{song.title}</h3>
        <p className="text-sm text-spotify-lightgray truncate">{song.artist}</p>
      </div>

      {/* Voting */}
      {showVoting && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onVote(song.id, 'up')}
            className={`p-2 rounded-full transition transform hover:scale-110 active:scale-95
              ${song.userVote === 'up' 
                ? 'bg-spotify-green text-black' 
                : 'bg-white/10 hover:bg-white/20 text-white'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          
          <span className={`w-8 text-center font-bold ${
            song.votes > 0 ? 'text-spotify-green' : 
            song.votes < 0 ? 'text-red-400' : 'text-spotify-lightgray'
          }`}>
            {song.votes}
          </span>
          
          <button
            onClick={() => onVote(song.id, 'down')}
            className={`p-2 rounded-full transition transform hover:scale-110 active:scale-95
              ${song.userVote === 'down' 
                ? 'bg-red-500 text-white' 
                : 'bg-white/10 hover:bg-white/20 text-white'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

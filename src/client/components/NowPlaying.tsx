import { Song } from '../hooks/useParty'

interface NowPlayingProps {
  song: Song | null
  onSkip?: () => void
}

export default function NowPlaying({ song, onSkip }: NowPlayingProps) {
  if (!song) {
    return (
      <div className="bg-gradient-to-br from-spotify-gray to-spotify-dark rounded-2xl p-8 text-center">
        <div className="text-6xl mb-4">🎵</div>
        <h2 className="text-xl font-bold text-spotify-lightgray">Nothing Playing</h2>
        <p className="text-sm text-gray-500 mt-2">Add songs to the queue to get started!</p>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-purple-900/50 to-spotify-gray rounded-2xl p-6 relative overflow-hidden">
      {/* Background blur effect */}
      {song.albumArt && (
        <div 
          className="absolute inset-0 opacity-20 blur-3xl"
          style={{ backgroundImage: `url(${song.albumArt})`, backgroundSize: 'cover' }}
        />
      )}
      
      <div className="relative flex items-center gap-6">
        {/* Album Art */}
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden shadow-xl flex-shrink-0">
          {song.albumArt ? (
            <img src={song.albumArt} alt={song.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-spotify-gray flex items-center justify-center text-4xl">
              🎵
            </div>
          )}
        </div>

        {/* Song Info */}
        <div className="flex-1 min-w-0">
          <p className="text-spotify-green text-sm font-medium uppercase tracking-wider mb-1">
            Now Playing
          </p>
          <h2 className="text-xl md:text-2xl font-bold truncate">{song.title}</h2>
          <p className="text-spotify-lightgray truncate">{song.artist}</p>
          
          {/* Visualizer bars */}
          <div className="flex items-end gap-1 mt-4 h-6">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-spotify-green rounded-full animate-pulse"
                style={{
                  height: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: `${0.5 + Math.random() * 0.5}s`
                }}
              />
            ))}
          </div>
        </div>

        {/* Skip button (for host) */}
        {onSkip && (
          <button
            onClick={onSkip}
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition"
            title="Skip"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

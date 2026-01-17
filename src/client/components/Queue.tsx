import { Song } from '../hooks/useParty'
import SongCard from './SongCard'

interface QueueProps {
  songs: Song[]
  onVote: (songId: string, direction: 'up' | 'down') => void
}

export default function Queue({ songs, onVote }: QueueProps) {
  if (songs.length === 0) {
    return (
      <div className="bg-spotify-gray/30 rounded-2xl p-8 text-center">
        <div className="text-4xl mb-3">📭</div>
        <h3 className="text-lg font-semibold text-spotify-lightgray">Queue is Empty</h3>
        <p className="text-sm text-gray-500 mt-1">Search for songs above to add them to the queue</p>
      </div>
    )
  }

  // Sort by votes (highest first)
  const sortedSongs = [...songs].sort((a, b) => b.votes - a.votes)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-lg font-bold">Up Next</h2>
        <span className="text-sm text-spotify-lightgray">{songs.length} songs</span>
      </div>
      
      <div className="space-y-2">
        {sortedSongs.map((song, index) => (
          <SongCard
            key={song.id}
            song={song}
            rank={index + 1}
            onVote={onVote}
          />
        ))}
      </div>
    </div>
  )
}

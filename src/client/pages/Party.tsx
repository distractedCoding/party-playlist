import { useEffect } from 'react'
import { useParty } from '../hooks/useParty'
import NowPlaying from '../components/NowPlaying'
import Queue from '../components/Queue'
import SearchBar from '../components/SearchBar'

interface PartyProps {
  partyCode: string
  onLeave: () => void
}

export default function Party({ partyCode, onLeave }: PartyProps) {
  const { 
    party, 
    queue, 
    nowPlaying,
    isConnected, 
    error,
    vote,
    addSong,
    skipSong
  } = useParty(partyCode)

  useEffect(() => {
    // Copy party link to clipboard on first load
    if (party) {
      const link = `${window.location.origin}/party/${partyCode}`
      navigator.clipboard?.writeText(link).catch(() => {})
    }
  }, [party, partyCode])

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <p className="text-6xl mb-4">😕</p>
          <h2 className="text-2xl font-bold mb-2">Party Not Found</h2>
          <p className="text-spotify-lightgray mb-6">{error}</p>
          <button
            onClick={onLeave}
            className="py-3 px-6 bg-spotify-green text-black font-bold rounded-full"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-6xl mb-4">🎵</div>
          <p className="text-spotify-lightgray">Connecting to party...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-spotify-dark/80 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button 
            onClick={onLeave}
            className="text-spotify-lightgray hover:text-white transition"
          >
            ← Leave
          </button>
          <div className="text-center">
            <h1 className="font-bold">{party?.name || 'Party'}</h1>
            <button 
              onClick={() => {
                navigator.clipboard?.writeText(`${window.location.origin}/party/${partyCode}`)
              }}
              className="text-spotify-green text-sm font-mono hover:underline"
            >
              {partyCode} 📋
            </button>
          </div>
          <div className="w-16 flex justify-end">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 space-y-6">
        {/* Now Playing */}
        <NowPlaying song={nowPlaying} onSkip={skipSong} />

        {/* Search */}
        <SearchBar onAddSong={addSong} />

        {/* Queue */}
        <Queue songs={queue} onVote={vote} />
      </main>
    </div>
  )
}

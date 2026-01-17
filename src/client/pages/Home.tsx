import { useState } from 'react'

interface HomeProps {
  onJoinParty: (code: string) => void
}

export default function Home({ onJoinParty }: HomeProps) {
  const [joinCode, setJoinCode] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreateParty = async () => {
    setIsCreating(true)
    setError(null)
    try {
      const res = await fetch('/api/party', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Party' }),
      })
      if (!res.ok) throw new Error('Failed to create party')
      const data = await res.json()
      onJoinParty(data.code)
    } catch (err) {
      setError('Failed to create party. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    if (joinCode.trim().length >= 4) {
      onJoinParty(joinCode.trim())
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center mb-12">
        <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
          🎵 Party Playlist
        </h1>
        <p className="text-spotify-lightgray text-lg">
          Create a party, share the code, and let everyone vote on songs!
        </p>
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Create Party */}
        <button
          onClick={handleCreateParty}
          disabled={isCreating}
          className="w-full py-4 px-6 bg-spotify-green hover:bg-green-400 disabled:bg-gray-600 
                     text-black font-bold text-lg rounded-full transition-all transform 
                     hover:scale-105 active:scale-95 shadow-lg shadow-green-500/20"
        >
          {isCreating ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Creating...
            </span>
          ) : (
            '🎉 Create New Party'
          )}
        </button>

        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-spotify-gray" />
          <span className="text-spotify-lightgray text-sm">or join existing</span>
          <div className="flex-1 h-px bg-spotify-gray" />
        </div>

        {/* Join Party */}
        <form onSubmit={handleJoin} className="space-y-4">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="Enter party code"
            maxLength={8}
            className="w-full py-4 px-6 bg-spotify-gray text-white text-center text-2xl 
                       tracking-widest font-mono rounded-xl border-2 border-transparent 
                       focus:border-spotify-green focus:outline-none placeholder:text-gray-500
                       placeholder:text-lg placeholder:tracking-normal"
          />
          <button
            type="submit"
            disabled={joinCode.trim().length < 4}
            className="w-full py-4 px-6 bg-spotify-gray hover:bg-gray-600 disabled:opacity-50
                       text-white font-bold text-lg rounded-full transition-all"
          >
            Join Party →
          </button>
        </form>

        {error && (
          <p className="text-red-400 text-center text-sm">{error}</p>
        )}
      </div>

      <footer className="absolute bottom-4 text-spotify-lightgray text-sm">
        Powered by Spotify 🎧
      </footer>
    </div>
  )
}

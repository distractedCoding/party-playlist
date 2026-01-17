import { useState, useEffect, useRef } from 'react'
import { Song } from '../hooks/useParty'

interface SearchBarProps {
  onAddSong: (song: Omit<Song, 'id' | 'votes' | 'userVote'>) => void
}

interface SpotifyTrack {
  id: string
  name: string
  artists: { name: string }[]
  album: {
    name: string
    images: { url: string }[]
  }
  uri: string
}

export default function SearchBar({ onAddSong }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SpotifyTrack[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout>()
  const containerRef = useRef<HTMLDivElement>(null)

  // Search as user types
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (query.trim().length < 2) {
      setResults([])
      return
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}`)
        if (res.ok) {
          const data = await res.json()
          setResults(data.tracks || [])
          setIsOpen(true)
        }
      } catch (err) {
        console.error('Search failed:', err)
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (track: SpotifyTrack) => {
    onAddSong({
      spotifyId: track.id,
      title: track.name,
      artist: track.artists.map(a => a.name).join(', '),
      albumArt: track.album.images[0]?.url,
      uri: track.uri,
    })
    setQuery('')
    setResults([])
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder="🔍 Search for songs..."
          className="w-full py-4 px-6 pr-12 bg-spotify-gray text-white rounded-xl
                     border-2 border-transparent focus:border-spotify-green focus:outline-none
                     placeholder:text-gray-500"
        />
        {isLoading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <svg className="animate-spin h-5 w-5 text-spotify-green" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-spotify-dark border border-white/10 rounded-xl 
                        shadow-2xl max-h-80 overflow-y-auto">
          {results.map((track) => (
            <button
              key={track.id}
              onClick={() => handleSelect(track)}
              className="w-full flex items-center gap-3 p-3 hover:bg-spotify-gray transition text-left"
            >
              <img
                src={track.album.images[2]?.url || track.album.images[0]?.url}
                alt={track.album.name}
                className="w-12 h-12 rounded shadow"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{track.name}</p>
                <p className="text-sm text-spotify-lightgray truncate">
                  {track.artists.map(a => a.name).join(', ')}
                </p>
              </div>
              <span className="text-spotify-green text-2xl">+</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

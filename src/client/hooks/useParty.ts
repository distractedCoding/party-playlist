import { useState, useCallback, useEffect } from 'react'
import { useWebSocket } from './useWebSocket'

export interface Song {
  id: string
  spotifyId: string
  title: string
  artist: string
  albumArt?: string
  uri: string
  votes: number
  userVote?: 'up' | 'down' | null
}

export interface Party {
  id: string
  code: string
  name: string
  hostId: string
}

interface PartyState {
  party: Party | null
  queue: Song[]
  nowPlaying: Song | null
}

export function useParty(partyCode: string) {
  const [state, setState] = useState<PartyState>({
    party: null,
    queue: [],
    nowPlaying: null,
  })
  const [error, setError] = useState<string | null>(null)
  const [userId] = useState(() => {
    // Get or create a persistent user ID
    let id = localStorage.getItem('party-user-id')
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('party-user-id', id)
    }
    return id
  })

  const handleMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'party:state':
        setState({
          party: data.party,
          queue: data.queue || [],
          nowPlaying: data.nowPlaying,
        })
        break
      
      case 'queue:update':
        setState(prev => ({
          ...prev,
          queue: data.queue || prev.queue,
        }))
        break
      
      case 'song:added':
        setState(prev => ({
          ...prev,
          queue: [...prev.queue, data.song],
        }))
        break
      
      case 'vote:update':
        setState(prev => ({
          ...prev,
          queue: prev.queue.map(song => 
            song.id === data.songId 
              ? { ...song, votes: data.votes, userVote: data.userVote }
              : song
          ),
        }))
        break
      
      case 'now-playing:update':
        setState(prev => ({
          ...prev,
          nowPlaying: data.song,
          queue: prev.queue.filter(s => s.id !== data.song?.id),
        }))
        break
      
      case 'error':
        setError(data.message)
        break
    }
  }, [])

  const { isConnected, send } = useWebSocket(`/ws?party=${partyCode}&user=${userId}`, {
    onMessage: handleMessage,
    onConnect: () => {
      send({ type: 'join', partyCode, userId })
    },
  })

  // Fetch initial party data
  useEffect(() => {
    const fetchParty = async () => {
      try {
        const res = await fetch(`/api/party/${partyCode}`)
        if (!res.ok) {
          if (res.status === 404) {
            setError('Party not found. Check the code and try again.')
          } else {
            setError('Failed to load party.')
          }
          return
        }
        const data = await res.json()
        setState(prev => ({
          ...prev,
          party: data.party,
          queue: data.queue || [],
          nowPlaying: data.nowPlaying,
        }))
      } catch (err) {
        setError('Failed to connect to party.')
      }
    }
    fetchParty()
  }, [partyCode])

  const vote = useCallback((songId: string, direction: 'up' | 'down') => {
    send({ type: 'vote', songId, direction, userId })
    
    // Optimistic update
    setState(prev => ({
      ...prev,
      queue: prev.queue.map(song => {
        if (song.id !== songId) return song
        
        const currentVote = song.userVote
        let voteChange = 0
        let newUserVote: 'up' | 'down' | null = direction
        
        if (currentVote === direction) {
          // Clicking same vote removes it
          voteChange = direction === 'up' ? -1 : 1
          newUserVote = null
        } else if (currentVote) {
          // Changing vote
          voteChange = direction === 'up' ? 2 : -2
        } else {
          // New vote
          voteChange = direction === 'up' ? 1 : -1
        }
        
        return {
          ...song,
          votes: song.votes + voteChange,
          userVote: newUserVote,
        }
      }),
    }))
  }, [send, userId])

  const addSong = useCallback((song: Omit<Song, 'id' | 'votes' | 'userVote'>) => {
    send({ type: 'add-song', ...song, userId })
  }, [send, userId])

  const skipSong = useCallback(() => {
    send({ type: 'skip', userId })
  }, [send, userId])

  return {
    ...state,
    isConnected,
    error,
    vote,
    addSong,
    skipSong,
  }
}

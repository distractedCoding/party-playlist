import { useState, useEffect } from 'react'
import Home from './pages/Home'
import Party from './pages/Party'

type Route = 'home' | 'party'

export default function App() {
  const [route, setRoute] = useState<Route>('home')
  const [partyCode, setPartyCode] = useState<string | null>(null)

  useEffect(() => {
    // Check URL for party code
    const path = window.location.pathname
    const match = path.match(/^\/party\/([A-Z0-9]+)$/i)
    if (match) {
      setPartyCode(match[1].toUpperCase())
      setRoute('party')
    }
  }, [])

  const handleJoinParty = (code: string) => {
    setPartyCode(code.toUpperCase())
    setRoute('party')
    window.history.pushState({}, '', `/party/${code.toUpperCase()}`)
  }

  const handleLeaveParty = () => {
    setPartyCode(null)
    setRoute('home')
    window.history.pushState({}, '', '/')
  }

  return (
    <div className="min-h-screen">
      {route === 'home' && <Home onJoinParty={handleJoinParty} />}
      {route === 'party' && partyCode && (
        <Party partyCode={partyCode} onLeave={handleLeaveParty} />
      )}
    </div>
  )
}

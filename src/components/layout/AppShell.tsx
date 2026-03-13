import type { ReactNode } from 'react'
import { useGameStore } from '../../store/gameStore'
import { useAuth } from '../../services/AuthContext'
import XPBar from '../rewards/XPBar'

interface Props {
  children: ReactNode
}

export default function AppShell({ children }: Props) {
  const screen = useGameStore((s) => s.screen)
  const activePlayerId = useGameStore((s) => s.activePlayerId)
  const { user, isGuest, signOut } = useAuth()

  const showXPBar = !!activePlayerId && (screen === 'map' || screen === 'results')
  const isLoggedIn = !!user || isGuest

  return (
    <div className="flex flex-col h-full max-w-lg mx-auto">
      {isLoggedIn && (
        <div className="flex items-center justify-between px-4 pt-2 pb-0">
          <div className="text-xs text-slate-500 truncate">
            {user ? user.displayName || user.email : 'Guest'}
          </div>
          <button
            onClick={signOut}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            {user ? 'Sign out' : 'Switch'}
          </button>
        </div>
      )}
      {showXPBar && <XPBar />}
      <main className="flex-1 overflow-hidden flex flex-col">
        {children}
      </main>
    </div>
  )
}

import type { ReactNode } from 'react'
import { useGameStore } from '../../store/gameStore'
import XPBar from '../rewards/XPBar'

interface Props {
  children: ReactNode
}

export default function AppShell({ children }: Props) {
  const screen = useGameStore((s) => s.screen)
  const playerName = useGameStore((s) => s.playerName)

  // Show XP bar on map and results screens (but not before name is set)
  const showXPBar = !!playerName && (screen === 'map' || screen === 'results')

  return (
    <div className="flex flex-col h-full max-w-lg mx-auto">
      {showXPBar && <XPBar />}
      <main className="flex-1 overflow-hidden flex flex-col">
        {children}
      </main>
    </div>
  )
}

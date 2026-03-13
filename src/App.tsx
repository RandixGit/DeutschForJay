import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from './store/gameStore'
import { useAuth } from './services/AuthContext'
import { useFirestoreSync } from './hooks/useFirestoreSync'
import AppShell from './components/layout/AppShell'
import ModuleMap from './components/layout/ModuleMap'
import LessonView from './components/layout/LessonView'
import ResultsScreen from './components/layout/ResultsScreen'
import ParentDashboard from './components/parent/ParentDashboard'
import CardUnlock from './components/rewards/CardUnlock'
import WelcomeScreen from './components/layout/WelcomeScreen'
import PlayerSelectScreen from './components/layout/PlayerSelectScreen'
import LoginScreen from './components/layout/LoginScreen'

function ScreenContent() {
  useFirestoreSync()
  const { user, isGuest, loading: authLoading } = useAuth()
  const hydrated = useGameStore((s) => s._hydrated)
  const screen = useGameStore((s) => s.screen)
  const players = useGameStore((s) => s.players)
  const activePlayerId = useGameStore((s) => s.activePlayerId)

  if (authLoading) return null

  // Not signed in and not guest → show login
  if (!user && !isGuest) {
    return (
      <motion.div
        key="login"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="h-full"
      >
        <LoginScreen />
      </motion.div>
    )
  }

  if (!hydrated) return null

  const effectiveScreen =
    Object.keys(players).length === 0
      ? 'welcome'
      : !activePlayerId
      ? 'player-select'
      : screen === 'welcome' ? 'map' : screen

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={effectiveScreen}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="h-full"
      >
        {effectiveScreen === 'welcome' && <WelcomeScreen />}
        {effectiveScreen === 'player-select' && <PlayerSelectScreen />}
        {effectiveScreen === 'map' && <ModuleMap />}
        {effectiveScreen === 'lesson' && <LessonView />}
        {effectiveScreen === 'results' && <ResultsScreen />}
        {effectiveScreen === 'card-unlock' && <CardUnlock />}
        {effectiveScreen === 'parent' && <ParentDashboard />}
      </motion.div>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <AppShell>
      <ScreenContent />
    </AppShell>
  )
}

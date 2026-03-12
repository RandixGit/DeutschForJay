import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from './store/gameStore'
import AppShell from './components/layout/AppShell'
import ModuleMap from './components/layout/ModuleMap'
import LessonView from './components/layout/LessonView'
import ResultsScreen from './components/layout/ResultsScreen'
import ParentDashboard from './components/parent/ParentDashboard'
import CardUnlock from './components/rewards/CardUnlock'
import WelcomeScreen from './components/layout/WelcomeScreen'

function ScreenContent() {
  const screen = useGameStore((s) => s.screen)
  const playerName = useGameStore((s) => s.playerName)

  const effectiveScreen = !playerName ? 'welcome' : screen

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

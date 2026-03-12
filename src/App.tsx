import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from './store/gameStore'
import AppShell from './components/layout/AppShell'
import ModuleMap from './components/layout/ModuleMap'
import LessonView from './components/layout/LessonView'
import ResultsScreen from './components/layout/ResultsScreen'
import ParentDashboard from './components/parent/ParentDashboard'
import CardUnlock from './components/rewards/CardUnlock'

function ScreenContent() {
  const screen = useGameStore((s) => s.screen)

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={screen}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="h-full"
      >
        {screen === 'map' && <ModuleMap />}
        {screen === 'lesson' && <LessonView />}
        {screen === 'results' && <ResultsScreen />}
        {screen === 'card-unlock' && <CardUnlock />}
        {screen === 'parent' && <ParentDashboard />}
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

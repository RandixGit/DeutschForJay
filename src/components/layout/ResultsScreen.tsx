import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useGameStore, getLevel, GERMAN_FACTS } from '../../store/gameStore'

export default function ResultsScreen() {
  const {
    lastLessonResult,
    xp,
    pendingCardUnlock,
    setScreen,
    collectCard,
    addCoupon,
  } = useGameStore()

  const factRef = useRef(
    GERMAN_FACTS[Math.floor(Math.random() * GERMAN_FACTS.length)]
  )

  const { current: lvl, progress } = getLevel(xp)

  useEffect(() => {
    // Check for coupon milestone (every 3 lessons completed)
    const state = useGameStore.getState()
    const totalLessons = Object.keys(state.completedLessons).length
    if (totalLessons > 0 && totalLessons % 5 === 0) {
      addCoupon(`Completed ${totalLessons} lessons! 🎉`)
    }
  }, [])

  if (!lastLessonResult) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <button className="btn-secondary" onClick={() => setScreen('map')}>← Back to Map</button>
      </div>
    )
  }

  const { stars, xpEarned, score } = lastLessonResult
  const starDisplay = '⭐'.repeat(stars) + '☆'.repeat(3 - stars)

  function handleContinue() {
    if (pendingCardUnlock) {
      setScreen('card-unlock')
    } else {
      setScreen('map')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 gap-5">
      {/* Stars */}
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 12 }}
        className="text-center"
      >
        <p className="text-6xl mb-2">
          {stars === 3 ? '🏆' : stars === 2 ? '🌟' : '⚽'}
        </p>
        <p className="text-4xl tracking-widest">{starDisplay}</p>
        <p className="text-slate-400 text-sm mt-1">Score: {score}%</p>
      </motion.div>

      {/* XP Earned */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card p-5 w-full max-w-sm text-center"
      >
        <p className="text-amber-400 text-3xl font-bold">+{xpEarned} XP</p>
        <p className="text-slate-400 text-sm mt-1">
          Total: {xp} XP — {lvl.icon} {lvl.name}
        </p>

        {/* XP Progress bar */}
        <div className="mt-3 bg-slate-700 rounded-full h-3 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </motion.div>

      {/* Fun fact */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="card p-4 w-full max-w-sm bg-blue-900/30 border border-blue-700"
      >
        <p className="text-blue-200 text-sm text-center">🇩🇪 Fun Fact!</p>
        <p className="text-slate-300 text-sm text-center mt-1">{factRef.current}</p>
      </motion.div>

      {/* Continue button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="btn-primary w-full max-w-sm text-xl py-4"
        onClick={handleContinue}
      >
        {pendingCardUnlock ? '🎴 Unlock Your Card!' : '← Back to Map'}
      </motion.button>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore, getLevel, GERMAN_FACTS } from '../../store/gameStore'
import { useSFX } from '../../hooks/useSFX'
import { useConfetti } from '../../hooks/useConfetti'

export default function ResultsScreen() {
  const {
    lastLessonResult,
    xp,
    pendingCardUnlock,
    setScreen,
    collectCard,
    addCoupon,
  } = useGameStore()

  const { play } = useSFX()
  const { burstBig, burstRainbow } = useConfetti()

  const factRef = useRef(
    GERMAN_FACTS[Math.floor(Math.random() * GERMAN_FACTS.length)]
  )

  const { current: lvl, progress } = getLevel(xp)

  // Animated XP counter
  const [displayXP, setDisplayXP] = useState(0)

  // Level-up detection
  const [showLevelUp, setShowLevelUp] = useState(false)
  const levelUpChecked = useRef(false)

  // Star reveal
  const [revealedStars, setRevealedStars] = useState(0)
  const starsRevealed = useRef(false)

  useEffect(() => {
    // Check for coupon milestone (every 5 lessons completed)
    const state = useGameStore.getState()
    const totalLessons = Object.keys(state.completedLessons).length
    if (totalLessons > 0 && totalLessons % 5 === 0) {
      addCoupon(`Completed ${totalLessons} lessons! 🎉`)
    }
  }, [])

  // Celebration sequence on mount
  useEffect(() => {
    if (!lastLessonResult) return

    const { stars, xpEarned } = lastLessonResult

    // 1. Fanfare + confetti
    const t1 = setTimeout(() => {
      play('fanfare')
      burstBig(stars)
    }, 300)

    // 2. Sequential star reveal
    if (!starsRevealed.current) {
      starsRevealed.current = true
      for (let i = 1; i <= stars; i++) {
        setTimeout(() => {
          setRevealedStars(i)
          play('correctDing')
        }, 400 + i * 350)
      }
    }

    // 3. Animated XP counter
    const duration = 1000
    const startTime = performance.now()
    let raf: number
    function animate(now: number) {
      const elapsed = now - startTime
      const t = Math.min(elapsed / duration, 1)
      // Ease out
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplayXP(Math.round(eased * xpEarned))
      if (t < 1) raf = requestAnimationFrame(animate)
    }
    const t2 = setTimeout(() => {
      raf = requestAnimationFrame(animate)
    }, 800 + stars * 350)

    // 4. Level-up check
    if (!levelUpChecked.current) {
      levelUpChecked.current = true
      const prevXP = xp - xpEarned
      const prevLevel = getLevel(prevXP)
      const currLevel = getLevel(xp)
      if (currLevel.current.level > prevLevel.current.level) {
        setTimeout(() => {
          setShowLevelUp(true)
          play('levelUp')
          burstRainbow()
        }, 1800 + stars * 350)
      }
    }

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [lastLessonResult])

  if (!lastLessonResult) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <button className="btn-secondary" onClick={() => setScreen('map')}>← Back to Map</button>
      </div>
    )
  }

  const { stars, xpEarned, score } = lastLessonResult

  const celebrationMsg =
    stars === 3 ? 'GOOOAL! Perfect score!' :
    stars === 2 ? 'Nice play! Almost perfect!' :
    'Good effort! Try again for more stars!'

  function handleContinue() {
    if (pendingCardUnlock) {
      setScreen('card-unlock')
    } else {
      setScreen('map')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 gap-5">
      {/* Trophy + Stars */}
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 12 }}
        className="text-center"
      >
        <p className="text-6xl mb-2">
          {stars === 3 ? '🏆' : stars === 2 ? '🌟' : '⚽'}
        </p>

        {/* Sequential star reveal */}
        <div className="flex justify-center gap-2 text-4xl">
          {[1, 2, 3].map((i) => (
            <motion.span
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={
                revealedStars >= i
                  ? { scale: 1, opacity: 1 }
                  : i <= stars
                  ? { scale: 0, opacity: 0 }
                  : { scale: 1, opacity: 0.3 }
              }
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 10,
              }}
            >
              {i <= stars ? '⭐' : '☆'}
            </motion.span>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 + stars * 0.35 }}
          className={`font-bold mt-2 ${
            stars === 3 ? 'text-amber-400 text-lg' :
            stars === 2 ? 'text-blue-400' :
            'text-slate-300'
          }`}
        >
          {celebrationMsg}
        </motion.p>

        <p className="text-slate-400 text-sm mt-1">Score: {score}%</p>
      </motion.div>

      {/* XP Earned */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card p-5 w-full max-w-sm text-center"
      >
        <p className="text-amber-400 text-3xl font-bold">+{displayXP} XP</p>
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

      {/* Level-up banner */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 12 }}
            className="card p-4 w-full max-w-sm bg-gradient-to-r from-purple-900/60 to-indigo-900/60 border border-purple-500 text-center"
          >
            <p className="text-2xl font-bold text-purple-300">LEVEL UP!</p>
            <p className="text-3xl mt-1">{lvl.icon}</p>
            <p className="text-white font-bold text-lg">{lvl.name}</p>
          </motion.div>
        )}
      </AnimatePresence>

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

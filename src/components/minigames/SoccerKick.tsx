import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore, getLevel } from '../../store/gameStore'
import { ALL_MODULES } from '../../services/curriculum'
import { useSFX } from '../../hooks/useSFX'
import { useConfetti } from '../../hooks/useConfetti'
import type { FlashcardTask } from '../../types/curriculum'

const ROUNDS = 5
const TIME_PER_ROUND = 5000 // ms

interface VocabPair {
  german: string
  english: string
}

/** Extract vocabulary from completed lessons */
function getVocabulary(completedLessons: Record<string, unknown>): VocabPair[] {
  const pairs: VocabPair[] = []
  for (const mod of ALL_MODULES) {
    for (const ch of mod.chapters) {
      for (const lesson of ch.lessons) {
        if (lesson.id in completedLessons) {
          for (const task of lesson.tasks) {
            if (task.type === 'flashcard') {
              const fc = task as FlashcardTask
              pairs.push({ german: fc.german, english: fc.english })
            }
          }
        }
      }
    }
  }
  return pairs
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

interface RoundQuestion {
  german: string
  options: string[]
  correctIndex: number
}

function generateRounds(vocab: VocabPair[], count: number): RoundQuestion[] {
  const shuffled = shuffle(vocab)
  const rounds: RoundQuestion[] = []
  for (let i = 0; i < count && i < shuffled.length; i++) {
    const correct = shuffled[i]
    // Pick 2 distractors
    const others = vocab.filter((v) => v.german !== correct.german)
    const distractors = shuffle(others).slice(0, 2)
    const options = shuffle([correct, ...distractors])
    rounds.push({
      german: correct.german,
      options: options.map((o) => o.english),
      correctIndex: options.findIndex((o) => o.german === correct.german),
    })
  }
  return rounds
}

type GamePhase = 'intro' | 'playing' | 'goal' | 'save' | 'done'

export default function SoccerKick() {
  const { completedLessons, xp, setScreen } = useGameStore()
  const { play } = useSFX()
  const { burstSmall, burstBig } = useConfetti()

  const vocab = useRef(getVocabulary(completedLessons))
  const [rounds] = useState(() => generateRounds(vocab.current, ROUNDS))
  const [roundIdx, setRoundIdx] = useState(0)
  const [phase, setPhase] = useState<GamePhase>('intro')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(TIME_PER_ROUND)
  const [ballPos, setBallPos] = useState<'center' | 'goal' | 'saved'>('center')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const currentRound = rounds[roundIdx]

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // Timer countdown
  useEffect(() => {
    if (phase !== 'playing') return
    setTimeLeft(TIME_PER_ROUND)
    const start = Date.now()
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - start
      const remaining = Math.max(0, TIME_PER_ROUND - elapsed)
      setTimeLeft(remaining)
      if (remaining <= 0) {
        stopTimer()
        handleAnswer(-1) // timeout = wrong
      }
    }, 50)
    return stopTimer
  }, [phase, roundIdx])

  function handleAnswer(idx: number) {
    stopTimer()
    if (!currentRound) return
    const correct = idx === currentRound.correctIndex
    if (correct) {
      setScore((s) => s + 1)
      setBallPos('goal')
      setPhase('goal')
      play('correctDing')
      burstSmall()
    } else {
      setBallPos('saved')
      setPhase('save')
      play('wrongBuzz')
    }

    // Advance after animation
    setTimeout(() => {
      setBallPos('center')
      if (roundIdx + 1 >= rounds.length) {
        setPhase('done')
      } else {
        setRoundIdx((i) => i + 1)
        setPhase('playing')
      }
    }, 1500)
  }

  function handleStart() {
    setPhase('playing')
  }

  function handleExit() {
    // Award XP for mini-game
    if (score > 0) {
      const xpEarned = score * 5
      const store = useGameStore.getState()
      const newXP = store.xp + xpEarned
      const pid = store.activePlayerId
      if (pid && store.players[pid]) {
        useGameStore.setState({
          xp: newXP,
          players: {
            ...store.players,
            [pid]: { ...store.players[pid], xp: newXP },
          },
        })
      } else {
        useGameStore.setState({ xp: newXP })
      }
    }
    setScreen('map')
  }

  // Not enough vocab
  if (vocab.current.length < 3) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 gap-4">
        <p className="text-5xl">⚽</p>
        <p className="text-white font-bold text-lg">Soccer Kick!</p>
        <p className="text-slate-400 text-sm text-center">
          Complete more lessons to unlock the mini-game! You need at least 3 vocabulary words.
        </p>
        <button className="btn-secondary" onClick={() => setScreen('map')}>
          ← Back to Map
        </button>
      </div>
    )
  }

  // Done screen
  if (phase === 'done') {
    const xpEarned = score * 5
    if (score >= 4) burstBig(3)
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 gap-5">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12 }}
          className="text-center"
        >
          <p className="text-6xl mb-2">{score >= 4 ? '🏆' : score >= 2 ? '⚽' : '😅'}</p>
          <p className="text-white font-bold text-2xl">
            {score >= 4 ? 'Hat Trick Hero!' : score >= 2 ? 'Nice Shots!' : 'Keep Practicing!'}
          </p>
          <p className="text-slate-400 mt-1">
            {score} / {rounds.length} goals scored
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-4 text-center"
        >
          <p className="text-amber-400 text-2xl font-bold">+{xpEarned} XP</p>
        </motion.div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="btn-primary w-full max-w-xs text-lg py-4"
          onClick={handleExit}
        >
          ← Back to Map
        </motion.button>
      </div>
    )
  }

  // Intro screen
  if (phase === 'intro') {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 gap-5">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <p className="text-7xl mb-3">⚽</p>
          <p className="text-white font-bold text-2xl">Soccer Kick!</p>
          <p className="text-slate-400 text-sm mt-2 max-w-xs">
            Pick the right English translation before time runs out.
            Score a goal for each correct answer!
          </p>
          <p className="text-amber-400 text-sm mt-2">{ROUNDS} rounds · {TIME_PER_ROUND / 1000}s each</p>
        </motion.div>
        <button className="btn-primary text-lg px-8 py-4" onClick={handleStart}>
          Kick Off! ⚽
        </button>
        <button className="btn-secondary text-sm" onClick={() => setScreen('map')}>
          ← Back
        </button>
      </div>
    )
  }

  // Playing / goal / save
  const timerPct = (timeLeft / TIME_PER_ROUND) * 100

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <button
          className="text-slate-400 hover:text-white text-2xl"
          onClick={handleExit}
        >
          ✕
        </button>
        <div className="flex-1 text-center">
          <span className="text-slate-400 text-sm">
            Round {roundIdx + 1}/{rounds.length}
          </span>
          <span className="text-amber-400 text-sm ml-3">⚽ {score}</span>
        </div>
      </div>

      {/* Timer bar */}
      <div className="px-4 pb-2">
        <div className="bg-slate-700 rounded-full h-2 overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${timerPct > 30 ? 'bg-green-500' : timerPct > 15 ? 'bg-amber-500' : 'bg-red-500'}`}
            style={{ width: `${timerPct}%` }}
            transition={{ duration: 0.05 }}
          />
        </div>
      </div>

      {/* Field */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
        {/* Soccer field visual */}
        <div className="relative w-full max-w-sm h-48 bg-gradient-to-b from-green-700 to-green-800 rounded-2xl border-2 border-green-600 overflow-hidden">
          {/* Goal net */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-16 border-2 border-white/50 rounded-t-lg" />

          {/* Goalkeeper */}
          <motion.div
            className="absolute top-4 text-4xl"
            animate={
              ballPos === 'saved'
                ? { x: [-20, 20][Math.floor(Math.random() * 2)], left: '50%', translateX: '-50%' }
                : { left: '50%', translateX: '-50%', x: 0 }
            }
            transition={{ duration: 0.3 }}
            style={{ left: '50%', translateX: '-50%' }}
          >
            🧤
          </motion.div>

          {/* Ball */}
          <motion.div
            className="absolute text-3xl"
            initial={{ bottom: 16, left: '50%', translateX: '-50%' }}
            animate={
              ballPos === 'goal'
                ? { bottom: 130, left: '50%', translateX: '-50%', scale: 0.6 }
                : ballPos === 'saved'
                ? { bottom: 90, left: '35%', translateX: '-50%', scale: 0.8, opacity: 0.5 }
                : { bottom: 16, left: '50%', translateX: '-50%', scale: 1, opacity: 1 }
            }
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            ⚽
          </motion.div>

          {/* Result overlay */}
          <AnimatePresence>
            {phase === 'goal' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-green-900/50"
              >
                <p className="text-white font-bold text-3xl">TOOOR! ⚽</p>
              </motion.div>
            )}
            {phase === 'save' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-red-900/50"
              >
                <p className="text-white font-bold text-2xl">Saved! 🧤</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Field markings */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-12 border-2 border-white/20 rounded-t-lg" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-white/30 rounded-full" style={{ bottom: '8px' }} />
        </div>

        {/* German word */}
        {currentRound && phase === 'playing' && (
          <motion.div
            key={roundIdx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-4 text-center w-full max-w-sm"
          >
            <p className="text-slate-400 text-xs uppercase">What does this mean?</p>
            <p className="text-white font-bold text-xl mt-1">{currentRound.german}</p>
          </motion.div>
        )}

        {/* Options */}
        {currentRound && phase === 'playing' && (
          <div className="grid grid-cols-3 gap-2 w-full max-w-sm">
            {currentRound.options.map((option, idx) => (
              <motion.button
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileTap={{ scale: 0.95 }}
                className="bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white font-semibold py-3 px-2 rounded-xl text-sm transition-colors"
                onClick={() => handleAnswer(idx)}
              >
                {option}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

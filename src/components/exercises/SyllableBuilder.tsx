import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { SyllableBuilderTask, TaskResult } from '../../types/curriculum'
import { useTTS } from '../../hooks/useTTS'
import { useSFX } from '../../hooks/useSFX'
import { useConfetti } from '../../hooks/useConfetti'
import FloatingXP from '../rewards/FloatingXP'

interface Props {
  task: SyllableBuilderTask
  onComplete: (result: TaskResult) => void
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const normalize = (s: string) => s.replace(/\s/g, '')

export default function SyllableBuilder({ task, onComplete }: Props) {
  const shuffled = useMemo(() => {
    let result = shuffle(task.syllables)
    let tries = 0
    while (result.join('') === task.syllables.join('') && tries < 10) {
      result = shuffle(task.syllables)
      tries++
    }
    return result
  }, [task.syllables])

  const [placed, setPlaced] = useState<string[]>([])
  const [attempts, setAttempts] = useState(0)
  const [done, setDone] = useState(false)
  const [showWrong, setShowWrong] = useState(false)
  const [showXP, setShowXP] = useState(false)
  const [wrongAttempts, setWrongAttempts] = useState<string[]>([])
  const { speak } = useTTS()
  const { play } = useSFX()
  const { burstSmall } = useConfetti()

  // Track bank usage with duplicate handling (same pattern as WordOrder)
  const bankItems = useMemo(() => {
    const placedCounts: Record<string, number> = {}
    placed.forEach(s => { placedCounts[s] = (placedCounts[s] || 0) + 1 })

    const result: { syllable: string; originalIndex: number; used: boolean }[] = []
    shuffled.forEach((syllable, idx) => {
      const usedCount = placedCounts[syllable] || 0
      const alreadyMarked = result.filter(r => r.syllable === syllable && r.used).length
      const isUsed = alreadyMarked < usedCount
      result.push({ syllable, originalIndex: idx, used: isUsed })
    })
    return result
  }, [shuffled, placed])

  function handlePickSyllable(syllable: string) {
    if (done || showWrong) return
    setPlaced([...placed, syllable])
  }

  function handleRemoveSyllable(idx: number) {
    if (done || showWrong) return
    setPlaced(placed.filter((_, i) => i !== idx))
  }

  function handleCheck() {
    if (done) return
    const newAttempts = attempts + 1
    setAttempts(newAttempts)

    const isCorrect = normalize(placed.join('')) === normalize(task.answer)

    if (isCorrect) {
      setDone(true)
      play('correctDing')
      burstSmall()
      setShowXP(true)
      if (task.tts) speak(task.answer, 'de-DE')
      setTimeout(() => {
        onComplete({
          correct: true,
          attempts: newAttempts,
          taskType: 'syllable-builder',
          wrongAnswers: wrongAttempts,
          expectedAnswer: task.answer,
        })
      }, 1200)
    } else {
      play('wrongBuzz')
      setWrongAttempts(prev => [...prev, placed.join('')])
      setShowWrong(true)
      setTimeout(() => {
        setShowWrong(false)
        if (newAttempts >= 3) {
          // Reveal correct order
          setPlaced([...task.syllables])
          setDone(true)
          if (task.tts) speak(task.answer, 'de-DE')
          setTimeout(() => {
            onComplete({
              correct: true,
              attempts: newAttempts,
              taskType: 'syllable-builder',
              wrongAnswers: wrongAttempts,
              expectedAnswer: task.answer,
            })
          }, 1500)
        }
      }, 800)
    }
  }

  const allPlaced = placed.length === task.syllables.length

  return (
    <div className="exercise-container relative">
      <AnimatePresence>{showXP && <FloatingXP amount={attempts === 1 ? 10 : 5} onComplete={() => setShowXP(false)} />}</AnimatePresence>
      <p className="text-slate-400 text-sm text-center uppercase tracking-wide">Build the Word</p>

      {/* Prompt */}
      <div className="card p-5 w-full text-center">
        <p className="text-white text-lg font-semibold leading-snug">{task.prompt}</p>
      </div>

      {/* Attempt indicator */}
      {attempts > 0 && !done && (
        <p className="text-amber-400 text-sm text-center">
          Attempt {attempts}/3 — tap syllables to rearrange
        </p>
      )}

      {/* Placed syllables */}
      <div
        className={`min-h-[56px] w-full rounded-xl border-2 border-dashed p-3 flex flex-wrap gap-2 items-center justify-center transition-colors ${
          done
            ? 'border-green-500 bg-green-900/20'
            : showWrong
            ? 'border-red-500 bg-red-900/20'
            : placed.length > 0
            ? 'border-violet-500 bg-slate-800/50'
            : 'border-slate-600 bg-slate-800/30'
        }`}
      >
        <AnimatePresence mode="popLayout">
          {placed.length === 0 && (
            <motion.p
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-slate-500 text-sm w-full text-center"
            >
              Tap the syllables below to build the word...
            </motion.p>
          )}
          {placed.map((syllable, idx) => (
            <motion.button
              key={`placed-${idx}-${syllable}`}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className={`px-3 py-2 rounded-lg font-semibold text-base transition-colors ${
                done
                  ? 'bg-green-600 text-white cursor-default'
                  : showWrong
                  ? 'bg-red-600 text-white animate-shake'
                  : 'bg-violet-600 hover:bg-violet-500 text-white active:scale-95'
              }`}
              onClick={() => handleRemoveSyllable(idx)}
              disabled={done || showWrong}
            >
              {syllable}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* Syllable bank */}
      <div className="flex flex-wrap gap-2 justify-center w-full">
        {bankItems.map((item, idx) => (
          <motion.button
            key={`bank-${idx}-${item.syllable}`}
            whileTap={{ scale: 0.93 }}
            className={`px-3 py-2 rounded-lg font-semibold text-base transition-all duration-150 ${
              item.used
                ? 'bg-slate-800 text-slate-600 border border-slate-700 cursor-default'
                : 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-500 active:scale-95'
            }`}
            onClick={() => !item.used && handlePickSyllable(item.syllable)}
            disabled={item.used || done || showWrong}
          >
            {item.syllable}
          </motion.button>
        ))}
      </div>

      {/* Check button */}
      {allPlaced && !done && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 px-8 rounded-xl text-lg transition-colors"
          onClick={handleCheck}
          disabled={showWrong}
        >
          Check
        </motion.button>
      )}

      {/* Success message */}
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-3 w-full bg-green-900/40 border border-green-600"
          >
            <p className="text-green-300 text-sm text-center">
              {attempts === 1 ? 'Perfect!' : attempts <= 2 ? 'Got it!' : task.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { WordOrderTask, TaskResult } from '../../types/curriculum'
import { useTTS } from '../../hooks/useTTS'
import { useSFX } from '../../hooks/useSFX'
import { useConfetti } from '../../hooks/useConfetti'
import FloatingXP from '../rewards/FloatingXP'

interface Props {
  task: WordOrderTask
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

export default function WordOrder({ task, onComplete }: Props) {
  // Shuffle words once per mount — ensure shuffled order differs from correct
  const shuffled = useMemo(() => {
    let result = shuffle(task.correctOrder)
    // Re-shuffle if accidentally in correct order
    let tries = 0
    while (result.join(' ') === task.correctOrder.join(' ') && tries < 10) {
      result = shuffle(task.correctOrder)
      tries++
    }
    return result
  }, [task.correctOrder])

  const [placed, setPlaced] = useState<string[]>([])
  const [attempts, setAttempts] = useState(0)
  const [done, setDone] = useState(false)
  const [showWrong, setShowWrong] = useState(false)
  const [showXP, setShowXP] = useState(false)
  const { speak } = useTTS()
  const { play } = useSFX()
  const { burstSmall } = useConfetti()

  // Words still available in the bank
  const available = shuffled.filter((word, idx) => {
    // Count how many times this word appears in shuffled up to idx
    const countInShuffled = shuffled.slice(0, idx + 1).filter(w => w === word).length
    // Count how many times it's been placed
    const countInPlaced = placed.filter(w => w === word).length
    // Available if not yet placed enough times
    return countInPlaced < countInShuffled
  })

  // Build a proper available list accounting for duplicates
  const availableWords = useMemo(() => {
    const placedCounts: Record<string, number> = {}
    placed.forEach(w => { placedCounts[w] = (placedCounts[w] || 0) + 1 })

    const result: { word: string; originalIndex: number; used: boolean }[] = []
    shuffled.forEach((word, idx) => {
      const usedCount = placedCounts[word] || 0
      const alreadyMarked = result.filter(r => r.word === word && r.used).length
      const isUsed = alreadyMarked < usedCount
      result.push({ word, originalIndex: idx, used: isUsed })
    })
    return result
  }, [shuffled, placed])

  function handlePickWord(word: string) {
    if (done || showWrong) return
    setPlaced([...placed, word])
  }

  function handleRemoveWord(idx: number) {
    if (done || showWrong) return
    setPlaced(placed.filter((_, i) => i !== idx))
  }

  function handleCheck() {
    if (done) return
    const newAttempts = attempts + 1
    setAttempts(newAttempts)

    if (placed.join(' ') === task.correctOrder.join(' ')) {
      setDone(true)
      play('correctDing')
      burstSmall()
      setShowXP(true)
      if (task.tts) {
        speak(task.correctOrder.join(' '), 'de-DE')
      }
      setTimeout(() => {
        onComplete({
          correct: true,
          attempts: newAttempts,
          taskType: 'word-order',
          expectedAnswer: task.correctOrder.join(' '),
        })
      }, 1200)
    } else {
      play('wrongBuzz')
      setShowWrong(true)
      setTimeout(() => {
        setShowWrong(false)
        // After 3 wrong attempts, reveal answer
        if (newAttempts >= 3) {
          setPlaced([...task.correctOrder])
          setDone(true)
          if (task.tts) {
            speak(task.correctOrder.join(' '), 'de-DE')
          }
          setTimeout(() => {
            onComplete({
              correct: true,
              attempts: newAttempts,
              taskType: 'word-order',
              wrongAnswers: [placed.join(' ')],
              expectedAnswer: task.correctOrder.join(' '),
            })
          }, 1500)
        }
      }, 800)
    }
  }

  const allPlaced = placed.length === task.correctOrder.length

  return (
    <div className="exercise-container relative">
      <AnimatePresence>{showXP && <FloatingXP amount={attempts === 1 ? 10 : 5} onComplete={() => setShowXP(false)} />}</AnimatePresence>
      <p className="text-slate-400 text-sm text-center uppercase tracking-wide">Arrange the Words</p>

      {/* Prompt */}
      <div className="card p-5 w-full text-center">
        <p className="text-white text-lg font-semibold leading-snug">{task.prompt}</p>
        <p className="text-slate-400 text-sm mt-2">🇬🇧 {task.english}</p>
      </div>

      {/* Attempt indicator */}
      {attempts > 0 && !done && (
        <p className="text-amber-400 text-sm text-center">
          Attempt {attempts}/3 — tap words to rearrange
        </p>
      )}

      {/* Placed words (sentence being built) */}
      <div
        className={`min-h-[56px] w-full rounded-xl border-2 border-dashed p-3 flex flex-wrap gap-2 items-center transition-colors ${
          done
            ? 'border-green-500 bg-green-900/20'
            : showWrong
            ? 'border-red-500 bg-red-900/20'
            : placed.length > 0
            ? 'border-blue-500 bg-slate-800/50'
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
              Tap the words below in the correct order...
            </motion.p>
          )}
          {placed.map((word, idx) => (
            <motion.button
              key={`placed-${idx}-${word}`}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className={`px-4 py-2 rounded-lg font-semibold text-base transition-colors ${
                done
                  ? 'bg-green-600 text-white cursor-default'
                  : showWrong
                  ? 'bg-red-600 text-white animate-shake'
                  : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95'
              }`}
              onClick={() => handleRemoveWord(idx)}
              disabled={done || showWrong}
            >
              {word}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* Word bank */}
      <div className="flex flex-wrap gap-2 justify-center w-full">
        {availableWords.map((item, idx) => (
          <motion.button
            key={`bank-${idx}-${item.word}`}
            layout
            whileTap={{ scale: 0.93 }}
            className={`px-4 py-2 rounded-lg font-semibold text-base transition-all duration-150 ${
              item.used
                ? 'bg-slate-800 text-slate-600 border border-slate-700 cursor-default'
                : 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 active:scale-95'
            }`}
            onClick={() => !item.used && handlePickWord(item.word)}
            disabled={item.used || done || showWrong}
          >
            {item.word}
          </motion.button>
        ))}
      </div>

      {/* Check button */}
      {allPlaced && !done && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl text-lg transition-colors"
          onClick={handleCheck}
          disabled={showWrong}
        >
          Check ✓
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
              {attempts === 1 ? '🌟 Perfect!' : attempts <= 2 ? '👍 Got it!' : '💡 ' + task.correctOrder.join(' ')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

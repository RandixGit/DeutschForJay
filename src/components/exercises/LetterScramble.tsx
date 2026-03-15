import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { LetterScrambleTask, TaskResult } from '../../types/curriculum'
import { useTTS } from '../../hooks/useTTS'
import { useSFX } from '../../hooks/useSFX'
import { useConfetti } from '../../hooks/useConfetti'
import FloatingXP from '../rewards/FloatingXP'

interface Props {
  task: LetterScrambleTask
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

export default function LetterScramble({ task, onComplete }: Props) {
  // Letters of the answer (keep spaces as-is for multi-word answers)
  const answerLetters = useMemo(() => task.answer.split(''), [task.answer])
  // Only scramble non-space characters
  const nonSpaceLetters = useMemo(() => answerLetters.filter(l => l !== ' '), [answerLetters])

  const shuffled = useMemo(() => {
    let result = shuffle(nonSpaceLetters)
    let tries = 0
    while (result.join('') === nonSpaceLetters.join('') && tries < 10) {
      result = shuffle(nonSpaceLetters)
      tries++
    }
    return result
  }, [nonSpaceLetters])

  const [placed, setPlaced] = useState<string[]>([])
  const [attempts, setAttempts] = useState(0)
  const [done, setDone] = useState(false)
  const [showWrong, setShowWrong] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [showXP, setShowXP] = useState(false)
  const [wrongAttempts, setWrongAttempts] = useState<string[]>([])
  const { speak } = useTTS()
  const { play } = useSFX()
  const { burstSmall } = useConfetti()

  // Track which bank items are used (handles duplicate letters — same pattern as WordOrder)
  const bankItems = useMemo(() => {
    const placedCounts: Record<string, number> = {}
    placed.forEach(l => { placedCounts[l] = (placedCounts[l] || 0) + 1 })

    const result: { letter: string; used: boolean }[] = []
    shuffled.forEach((letter) => {
      const usedCount = placedCounts[letter] || 0
      const alreadyMarked = result.filter(r => r.letter === letter && r.used).length
      const isUsed = alreadyMarked < usedCount
      result.push({ letter, used: isUsed })
    })
    return result
  }, [shuffled, placed])

  function handlePickLetter(letter: string) {
    if (done || showWrong) return
    const newPlaced = [...placed, letter]
    setPlaced(newPlaced)

    // Auto-check when all non-space letters are placed
    if (newPlaced.length === nonSpaceLetters.length) {
      checkAnswer(newPlaced)
    }
  }

  function handleRemoveLetter(idx: number) {
    if (done || showWrong) return
    setPlaced(placed.filter((_, i) => i !== idx))
  }

  function checkAnswer(currentPlaced: string[]) {
    const newAttempts = attempts + 1
    setAttempts(newAttempts)

    // Reconstruct with spaces in the right positions
    let placedIdx = 0
    const built = answerLetters.map(ch => {
      if (ch === ' ') return ' '
      return currentPlaced[placedIdx++] ?? ''
    }).join('')

    const isCorrect = built === task.answer

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
          taskType: 'letter-scramble',
          wrongAnswers: wrongAttempts,
          expectedAnswer: task.answer,
        })
      }, 1000)
    } else {
      play('wrongBuzz')
      setWrongAttempts(prev => [...prev, built])
      setShowWrong(true)

      if (newAttempts >= 3) {
        setTimeout(() => {
          setShowWrong(false)
          setPlaced([...nonSpaceLetters.map((_, i) => {
            // Reconstruct correct non-space letter order
            return task.answer.split('').filter(c => c !== ' ')[i]
          })])
          setDone(true)
          if (task.tts) speak(task.answer, 'de-DE')
          setTimeout(() => {
            onComplete({
              correct: true,
              attempts: newAttempts,
              taskType: 'letter-scramble',
              wrongAnswers: wrongAttempts,
              expectedAnswer: task.answer,
            })
          }, 1500)
        }, 800)
      } else {
        setTimeout(() => {
          setShowWrong(false)
          setPlaced([])
        }, 800)
      }
    }
  }

  // Render placed letters with spaces inserted at correct positions
  function renderPlaced() {
    if (placed.length === 0) return null
    let placedIdx = 0
    return answerLetters.map((ch, i) => {
      if (ch === ' ') {
        return <div key={`space-${i}`} className="w-2" />
      }
      if (placedIdx >= placed.length) {
        return (
          <div
            key={`empty-${i}`}
            className="w-10 h-11 rounded-lg border-2 border-dashed border-slate-600 bg-slate-800/30"
          />
        )
      }
      const currentIdx = placedIdx
      const letter = placed[placedIdx++]
      return (
        <motion.button
          key={`placed-${currentIdx}-${letter}`}
          layout
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className={`w-10 h-11 rounded-lg text-lg font-bold flex items-center justify-center transition-colors ${
            done
              ? 'bg-green-600 text-white cursor-default'
              : showWrong
              ? 'bg-red-600 text-white animate-shake'
              : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95'
          }`}
          onClick={() => handleRemoveLetter(currentIdx)}
          disabled={done || showWrong}
        >
          {letter}
        </motion.button>
      )
    })
  }

  return (
    <div className="exercise-container relative">
      <AnimatePresence>{showXP && <FloatingXP amount={attempts === 1 ? 10 : 5} onComplete={() => setShowXP(false)} />}</AnimatePresence>
      <p className="text-slate-400 text-sm text-center uppercase tracking-wide">Letter Scramble</p>

      {/* Prompt */}
      <div className="card p-5 w-full text-center">
        <p className="text-white text-lg font-semibold leading-snug">{task.prompt}</p>
      </div>

      {/* Hint */}
      {task.hint && (
        <div className="w-full flex justify-center">
          {!showHint ? (
            <button
              className="text-amber-400 hover:text-amber-300 text-sm underline"
              onClick={() => setShowHint(true)}
            >
              Show hint
            </button>
          ) : (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-amber-300 text-sm text-center">
              {task.hint}
            </motion.p>
          )}
        </div>
      )}

      {/* Attempt indicator */}
      {attempts > 0 && !done && (
        <p className="text-amber-400 text-sm text-center">
          Attempt {attempts}/3 — tap letters to rearrange
        </p>
      )}

      {/* Placed letters area */}
      <div
        className={`min-h-[52px] w-full rounded-xl border-2 border-dashed p-3 flex flex-wrap gap-1.5 items-center justify-center transition-colors ${
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
              Tap the letters below to spell the word...
            </motion.p>
          )}
          {renderPlaced()}
        </AnimatePresence>
      </div>

      {/* Letter bank */}
      <div className="flex flex-wrap gap-2 justify-center w-full">
        {bankItems.map((item, idx) => (
          <motion.button
            key={`bank-${idx}-${item.letter}`}
            whileTap={{ scale: 0.9 }}
            className={`w-11 h-11 rounded-lg text-lg font-semibold flex items-center justify-center transition-all duration-150 ${
              item.used
                ? 'bg-slate-800 text-slate-600 border border-slate-700'
                : 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-500 active:scale-95'
            }`}
            onClick={() => !item.used && handlePickLetter(item.letter)}
            disabled={item.used || done || showWrong}
          >
            {item.letter}
          </motion.button>
        ))}
      </div>

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

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { FillInBlankTask, TaskResult } from '../../types/curriculum'
import { useTTS } from '../../hooks/useTTS'
import { useSFX } from '../../hooks/useSFX'
import { useConfetti } from '../../hooks/useConfetti'
import FloatingXP from '../rewards/FloatingXP'

const GERMAN_LETTERS = 'abcdefghijklmnoprstuvwäöüß'.split('')

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Pick which indices to blank out (never the first character) */
function pickBlanks(word: string): number[] {
  const len = word.length
  const count = len <= 3 ? 1 : len <= 6 ? 2 : 3
  // Candidate indices: skip index 0 and skip spaces
  const candidates = Array.from({ length: len }, (_, i) => i).filter(i => i > 0 && word[i] !== ' ')
  const picked: number[] = []
  const pool = shuffle(candidates)
  for (const idx of pool) {
    if (picked.length >= count) break
    picked.push(idx)
  }
  return picked.sort((a, b) => a - b)
}

/** Generate distractor letters that aren't in the missing set */
function distractors(missing: string[], count: number): string[] {
  const missingSet = new Set(missing.map(l => l.toLowerCase()))
  const pool = GERMAN_LETTERS.filter(l => !missingSet.has(l))
  return shuffle(pool).slice(0, count)
}

interface Props {
  task: FillInBlankTask
  onComplete: (result: TaskResult) => void
}

export default function FillInBlank({ task, onComplete }: Props) {
  const answer = task.answer

  // Derive blanks and letter bank once per mount
  const { blankIndices, letters, bank } = useMemo(() => {
    const indices = pickBlanks(answer)
    const missing = indices.map(i => answer[i])
    const extras = distractors(missing, Math.min(3, Math.max(2, 5 - missing.length)))
    return {
      blankIndices: new Set(indices),
      letters: answer.split(''),
      bank: shuffle([...missing, ...extras]),
    }
  }, [answer])

  const [filledSlots, setFilledSlots] = useState<(string | null)[]>(
    () => Array.from({ length: blankIndices.size }, () => null)
  )
  const [bankUsed, setBankUsed] = useState<boolean[]>(() => bank.map(() => false))
  const [attempts, setAttempts] = useState(0)
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [wrongAttempts, setWrongAttempts] = useState<string[]>([])
  const [showHint, setShowHint] = useState(false)
  const [showXP, setShowXP] = useState(false)
  const { speak } = useTTS()
  const { play } = useSFX()
  const { burstSmall } = useConfetti()

  // Map from blank position (0,1,2...) to the actual index in the word
  const blankPositions = useMemo(
    () => [...blankIndices].sort((a, b) => a - b),
    [blankIndices]
  )

  // Next empty slot index
  const nextEmpty = filledSlots.indexOf(null)

  function handleTapBank(bankIdx: number) {
    if (status === 'correct' || bankUsed[bankIdx]) return
    if (nextEmpty === -1) return // all slots filled

    const newSlots = [...filledSlots]
    newSlots[nextEmpty] = bank[bankIdx]

    const newUsed = [...bankUsed]
    newUsed[bankIdx] = true

    setFilledSlots(newSlots)
    setBankUsed(newUsed)

    // Auto-check when all slots filled
    if (newSlots.every(s => s !== null)) {
      checkAnswer(newSlots as string[], newUsed)
    }
  }

  function handleTapSlot(slotIdx: number) {
    if (status === 'correct' || filledSlots[slotIdx] === null) return

    const letter = filledSlots[slotIdx]
    // Find the first used bank item matching this letter to un-use
    const bankIdx = bank.findIndex((l, i) => l === letter && bankUsed[i])

    const newSlots = [...filledSlots]
    newSlots[slotIdx] = null
    setFilledSlots(newSlots)

    if (bankIdx !== -1) {
      const newUsed = [...bankUsed]
      newUsed[bankIdx] = false
      setBankUsed(newUsed)
    }
    // Reset wrong status if removing after a wrong attempt
    if (status === 'wrong') setStatus('idle')
  }

  function checkAnswer(slots: string[], usedState: boolean[]) {
    const newAttempts = attempts + 1
    setAttempts(newAttempts)

    // Build the reconstructed word
    let slotCursor = 0
    const built = letters.map((ch, i) => {
      if (blankIndices.has(i)) {
        return slots[slotCursor++]
      }
      return ch
    }).join('')

    const isCorrect = built.toLowerCase().replace(/ß/g, 'ss') === answer.toLowerCase().replace(/ß/g, 'ss')

    if (isCorrect) {
      setStatus('correct')
      play('correctDing')
      burstSmall()
      setShowXP(true)
      if (task.tts) speak(task.sentence.replace('___', task.answer), 'de-DE')
      setTimeout(() => {
        onComplete({ correct: true, attempts: newAttempts, taskType: 'fill-in-blank', wrongAnswers: wrongAttempts, expectedAnswer: task.answer })
      }, 1000)
    } else {
      play('wrongBuzz')
      setWrongAttempts(prev => [...prev, built])
      setStatus('wrong')

      // After 3 wrong attempts, reveal
      if (newAttempts >= 3) {
        setTimeout(() => {
          // Fill in correct letters
          const correctSlots = blankPositions.map(i => answer[i])
          setFilledSlots(correctSlots)
          setStatus('correct')
          if (task.tts) speak(task.sentence.replace('___', task.answer), 'de-DE')
          setTimeout(() => {
            onComplete({ correct: true, attempts: newAttempts, taskType: 'fill-in-blank', wrongAnswers: wrongAttempts, expectedAnswer: task.answer })
          }, 1500)
        }, 800)
      } else {
        // Reset slots after brief shake
        setTimeout(() => {
          setFilledSlots(Array.from({ length: blankIndices.size }, () => null))
          setBankUsed(bank.map(() => false))
          setStatus('idle')
        }, 800)
      }
    }
  }

  const parts = task.sentence.split('___')
  const before = parts[0] ?? ''
  const after = parts[1] ?? ''

  return (
    <div className="exercise-container relative">
      <AnimatePresence>{showXP && <FloatingXP amount={attempts === 1 ? 10 : 5} onComplete={() => setShowXP(false)} />}</AnimatePresence>
      <p className="text-slate-400 text-sm text-center uppercase tracking-wide">Missing Letters</p>

      {/* Sentence context */}
      <div className="card p-5 w-full text-center">
        <p className="text-slate-300 text-lg leading-relaxed">
          {before}<span className="text-white font-semibold">{'?'}</span>{after}
        </p>
      </div>

      {/* Letter tiles for the answer word */}
      <div className="flex flex-wrap gap-1.5 justify-center w-full">
        {(() => {
          let slotIdx = 0
          return letters.map((ch, i) => {
            if (ch === ' ') {
              return <div key={`space-${i}`} className="w-3" />
            }
            if (blankIndices.has(i)) {
              const currentSlotIdx = slotIdx
              const filled = filledSlots[currentSlotIdx]
              slotIdx++
              return (
                <motion.button
                  key={`tile-${i}`}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleTapSlot(currentSlotIdx)}
                  className={`w-11 h-12 rounded-lg text-xl font-bold flex items-center justify-center border-2 transition-colors ${
                    status === 'correct'
                      ? 'bg-green-600/30 border-green-500 text-green-300'
                      : status === 'wrong' && filled
                      ? 'bg-red-600/30 border-red-500 text-red-300 animate-shake'
                      : filled
                      ? 'bg-blue-600/30 border-blue-500 text-blue-300 cursor-pointer'
                      : 'bg-slate-800 border-dashed border-slate-500 text-slate-500'
                  }`}
                  disabled={status === 'correct'}
                >
                  {filled ?? '_'}
                </motion.button>
              )
            }
            return (
              <div
                key={`tile-${i}`}
                className={`w-11 h-12 rounded-lg text-xl font-bold flex items-center justify-center border-2 transition-colors ${
                  status === 'correct'
                    ? 'bg-green-600/30 border-green-500 text-green-300'
                    : 'bg-slate-700/50 border-slate-600 text-white'
                }`}
              >
                {ch}
              </div>
            )
          })
        })()}
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
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-amber-300 text-sm text-center"
            >
              {task.hint}
            </motion.p>
          )}
        </div>
      )}

      {/* Attempt indicator */}
      {attempts > 0 && status !== 'correct' && (
        <p className="text-amber-400 text-sm text-center">
          Attempt {attempts}/3 — tap a letter to change it
        </p>
      )}

      {/* Letter bank */}
      <div className="flex flex-wrap gap-2 justify-center w-full">
        {bank.map((letter, idx) => (
          <motion.button
            key={`bank-${idx}`}
            whileTap={{ scale: 0.9 }}
            className={`w-11 h-11 rounded-lg text-lg font-semibold flex items-center justify-center transition-all duration-150 ${
              bankUsed[idx]
                ? 'bg-slate-800 text-slate-600 border border-slate-700'
                : 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-500 active:scale-95'
            }`}
            onClick={() => handleTapBank(idx)}
            disabled={bankUsed[idx] || status === 'correct'}
          >
            {letter}
          </motion.button>
        ))}
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {status === 'correct' && (
          <motion.p initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            className="text-green-400 font-bold text-lg">
            Richtig! (Correct!)
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

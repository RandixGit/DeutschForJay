import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ListenConfirmTask, TaskResult } from '../../types/curriculum'
import { useTTS } from '../../hooks/useTTS'
import { useSFX } from '../../hooks/useSFX'
import { useConfetti } from '../../hooks/useConfetti'
import FloatingXP from '../rewards/FloatingXP'

interface Props {
  task: ListenConfirmTask
  onComplete: (result: TaskResult) => void
}

export default function ListenConfirm({ task, onComplete }: Props) {
  const [played, setPlayed] = useState(false)
  const [showQuestion, setShowQuestion] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [wrongAnswers, setWrongAnswers] = useState<string[]>([])
  const [showXP, setShowXP] = useState(false)
  const { speak } = useTTS()
  const { play } = useSFX()
  const { burstSmall } = useConfetti()

  function handlePlay() {
    speak(task.german, 'de-DE')
    setPlayed(true)
    // Show question after a short delay to encourage listening first
    if (!showQuestion) {
      setTimeout(() => setShowQuestion(true), 1200)
    }
  }

  function handleSelect(idx: number) {
    if (status === 'correct') return
    setSelected(idx)

    const newAttempts = attempts + 1
    setAttempts(newAttempts)

    if (idx === task.correct) {
      setStatus('correct')
      play('correctDing')
      burstSmall()
      setShowXP(true)
      setTimeout(() => {
        onComplete({
          correct: true,
          attempts: newAttempts,
          taskType: 'listen-confirm',
          wrongAnswers,
          expectedAnswer: task.options[task.correct],
        })
      }, 1000)
    } else {
      play('wrongBuzz')
      setWrongAnswers(prev => [...prev, task.options[idx]])
      setStatus('wrong')

      if (newAttempts >= 3) {
        // Reveal correct answer
        setTimeout(() => {
          setSelected(task.correct)
          setStatus('correct')
          setTimeout(() => {
            onComplete({
              correct: true,
              attempts: newAttempts,
              taskType: 'listen-confirm',
              wrongAnswers: [...wrongAnswers, task.options[idx]],
              expectedAnswer: task.options[task.correct],
            })
          }, 1500)
        }, 800)
      } else {
        setTimeout(() => {
          setSelected(null)
          setStatus('idle')
        }, 800)
      }
    }
  }

  const optionLabels = ['A', 'B', 'C', 'D']

  return (
    <div className="exercise-container relative">
      <AnimatePresence>
        {showXP && (
          <FloatingXP
            amount={attempts === 1 ? 10 : 5}
            onComplete={() => setShowXP(false)}
          />
        )}
      </AnimatePresence>
      <p className="text-slate-400 text-sm text-center uppercase tracking-wide">
        Listen & Understand
      </p>

      {/* German sentence card */}
      <div className="card p-5 w-full text-center space-y-2">
        <p className="text-white text-lg font-semibold leading-snug">
          {task.german}
        </p>
        <p className="text-slate-400 text-sm italic">
          &ldquo;{task.english}&rdquo;
        </p>
      </div>

      {/* Play button */}
      <motion.button
        whileTap={{ scale: 0.93 }}
        className={`w-full py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 transition-all ${
          played
            ? 'bg-blue-700 hover:bg-blue-600 border border-blue-500'
            : 'bg-blue-500 hover:bg-blue-600 border-2 border-blue-400 shadow-lg shadow-blue-500/30'
        }`}
        onClick={handlePlay}
      >
        🔊 {played ? 'Play Again' : 'Listen!'}
      </motion.button>

      {/* Comprehension question + options */}
      <AnimatePresence>
        {showQuestion && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full space-y-3"
          >
            <p className="text-slate-300 text-center font-medium">
              {task.question}
            </p>

            {/* Attempt indicator */}
            {attempts > 0 && status !== 'correct' && (
              <p className="text-amber-400 text-sm text-center">
                Attempt {attempts}/3
              </p>
            )}

            <div className="grid gap-2 w-full">
              {task.options.map((option, idx) => {
                const isSelected = selected === idx
                const isCorrectOption = idx === task.correct

                let classes =
                  'w-full py-3 px-4 rounded-xl text-left font-medium transition-all border-2 flex items-center gap-3'

                if (status === 'correct' && isCorrectOption) {
                  classes +=
                    ' bg-green-600/30 border-green-500 text-green-300'
                } else if (status === 'wrong' && isSelected) {
                  classes +=
                    ' bg-red-600/30 border-red-500 text-red-300 animate-shake'
                } else if (status === 'correct') {
                  classes +=
                    ' bg-slate-800 border-slate-700 text-slate-500'
                } else {
                  classes +=
                    ' bg-slate-700 hover:bg-slate-600 border-slate-500 text-white active:scale-[0.98]'
                }

                return (
                  <motion.button
                    key={idx}
                    whileTap={
                      status !== 'correct' ? { scale: 0.97 } : undefined
                    }
                    className={classes}
                    onClick={() => handleSelect(idx)}
                    disabled={status === 'correct' || status === 'wrong'}
                  >
                    <span className="w-7 h-7 rounded-full bg-slate-600 flex items-center justify-center text-sm font-bold shrink-0">
                      {optionLabels[idx]}
                    </span>
                    {option}
                  </motion.button>
                )
              })}
            </div>

            {/* Feedback */}
            <AnimatePresence>
              {status === 'correct' && (
                <motion.p
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-green-400 font-bold text-lg text-center"
                >
                  Richtig! (Correct!)
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

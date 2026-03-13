import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { MultipleChoiceTask, TaskResult } from '../../types/curriculum'
import { useTTS } from '../../hooks/useTTS'

interface Props {
  task: MultipleChoiceTask
  onComplete: (result: TaskResult) => void
}

export default function MultipleChoice({ task, onComplete }: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [done, setDone] = useState(false)
  const [wrongSelections, setWrongSelections] = useState<string[]>([])
  const { speak } = useTTS()

  function handleSelect(idx: number) {
    if (done) return
    const isCorrect = idx === task.correct
    const newAttempts = attempts + 1
    setSelected(idx)
    setAttempts(newAttempts)

    // TTS the clicked option in German when options are German words
    if (task.promptLanguage !== 'en') {
      speak(task.options[idx], 'de-DE')
    }

    if (isCorrect) {
      setDone(true)
      // Short delay so user sees the green feedback, then advance
      setTimeout(() => {
        onComplete({ correct: true, attempts: newAttempts, taskType: 'multiple-choice', wrongAnswers: wrongSelections, expectedAnswer: task.options[task.correct] })
      }, 900)
    } else {
      setWrongSelections((prev) => [...prev, task.options[idx]])
      // Wrong — shake and let them try again after a moment
      setTimeout(() => setSelected(null), 800)
    }
  }

  function buttonStyle(idx: number) {
    if (selected === null) {
      return 'bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white'
    }
    if (idx === task.correct && selected !== null) {
      return 'bg-green-500 border border-green-400 text-white'
    }
    if (idx === selected && selected !== task.correct) {
      return 'bg-red-500 border border-red-400 text-white animate-shake'
    }
    return 'bg-slate-700 border border-slate-600 text-slate-400 opacity-60'
  }

  return (
    <div className="exercise-container">
      <p className="text-slate-400 text-sm text-center uppercase tracking-wide">Multiple Choice</p>

      {/* Question */}
      <div className="card p-5 w-full text-center">
        <p className="text-white text-lg font-semibold leading-snug">{task.prompt}</p>
      </div>

      {/* Attempt indicator */}
      {attempts > 1 && !done && (
        <p className="text-amber-400 text-sm">
          Try again! Attempts: {attempts}
        </p>
      )}

      {/* Options grid */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {task.options.map((option, idx) => (
          <motion.button
            key={idx}
            whileTap={{ scale: 0.96 }}
            className={`py-4 px-3 rounded-xl font-semibold text-base transition-all duration-200 ${buttonStyle(idx)}`}
            onClick={() => handleSelect(idx)}
            disabled={done}
          >
            {option}
          </motion.button>
        ))}
      </div>

      {/* Explanation on correct */}
      <AnimatePresence>
        {done && task.explanation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-3 w-full bg-green-900/40 border border-green-600"
          >
            <p className="text-green-300 text-sm text-center">💡 {task.explanation}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

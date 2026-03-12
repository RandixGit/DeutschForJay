import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { FillInBlankTask, TaskResult } from '../../types/curriculum'
import { useTTS } from '../../hooks/useTTS'

const UMLAUTS = ['ä', 'ö', 'ü', 'Ä', 'Ö', 'Ü', 'ß']

interface Props {
  task: FillInBlankTask
  onComplete: (result: TaskResult) => void
}

export default function FillInBlank({ task, onComplete }: Props) {
  const [input, setInput] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const inputRef = useRef<HTMLInputElement>(null)
  const { speak } = useTTS()

  const parts = task.sentence.split('___')
  const before = parts[0] ?? ''
  const after = parts[1] ?? ''

  function insertUmlaut(char: string) {
    setInput((prev) => prev + char)
    inputRef.current?.focus()
  }

  function handleSubmit() {
    if (!input.trim() || status === 'correct') return
    const newAttempts = attempts + 1
    setAttempts(newAttempts)

    const isCorrect =
      input.trim().toLowerCase() === task.answer.toLowerCase()

    if (isCorrect) {
      setStatus('correct')
      if (task.tts) speak(task.sentence.replace('___', task.answer), 'de-DE')
      setTimeout(() => {
        onComplete({ correct: true, attempts: newAttempts })
      }, 1000)
    } else {
      setStatus('wrong')
      setTimeout(() => {
        setStatus('idle')
        setInput('')
      }, 800)
    }
  }

  return (
    <div className="exercise-container">
      <p className="text-slate-400 text-sm text-center uppercase tracking-wide">Fill in the blank</p>

      {/* Sentence with blank */}
      <div className="card p-5 w-full text-center">
        <p className="text-white text-xl font-semibold leading-relaxed">
          <span className="text-slate-300">{before}</span>
          <span
            className={`inline-block min-w-[80px] border-b-2 mx-1 text-center
              ${status === 'correct' ? 'border-green-400 text-green-300' :
                status === 'wrong' ? 'border-red-400 text-red-300 animate-shake' :
                'border-blue-400 text-blue-300'}`}
          >
            {input || '___'}
          </span>
          <span className="text-slate-300">{after}</span>
        </p>
      </div>

      {/* Hint */}
      {task.hint && (
        <div className="w-full flex justify-center">
          {!showHint ? (
            <button
              className="text-amber-400 hover:text-amber-300 text-sm underline"
              onClick={() => setShowHint(true)}
            >
              💡 Show hint
            </button>
          ) : (
            <AnimatePresence>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-amber-300 text-sm text-center"
              >
                💡 {task.hint}
              </motion.p>
            </AnimatePresence>
          )}
        </div>
      )}

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        placeholder="Type your answer..."
        className={`w-full bg-slate-700 border-2 rounded-xl px-4 py-3 text-white text-lg text-center
          outline-none transition-colors
          ${status === 'correct' ? 'border-green-400' :
            status === 'wrong' ? 'border-red-400 animate-shake' :
            'border-slate-500 focus:border-blue-400'}`}
        disabled={status === 'correct'}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
      />

      {/* Umlaut helper */}
      <div className="flex gap-2 flex-wrap justify-center">
        {UMLAUTS.map((ch) => (
          <button
            key={ch}
            className="bg-slate-700 hover:bg-slate-600 text-white text-base px-3 py-1.5 rounded-lg border border-slate-600 transition-colors"
            onClick={() => insertUmlaut(ch)}
            type="button"
          >
            {ch}
          </button>
        ))}
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {status === 'correct' && (
          <motion.p initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            className="text-green-400 font-bold text-lg">
            ✅ Richtig! (Correct!)
          </motion.p>
        )}
        {status === 'wrong' && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-red-400 text-sm">
            Not quite — try again!
          </motion.p>
        )}
        {attempts >= 3 && status === 'idle' && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-amber-300 text-sm">
            The answer is: <strong>{task.answer}</strong>
          </motion.p>
        )}
      </AnimatePresence>

      <button
        className="btn-primary w-full"
        onClick={handleSubmit}
        disabled={!input.trim() || status === 'correct'}
      >
        Check ✓
      </button>
    </div>
  )
}

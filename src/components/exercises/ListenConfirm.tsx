import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ListenConfirmTask, TaskResult } from '../../types/curriculum'
import { useTTS } from '../../hooks/useTTS'

const UMLAUTS = ['ä', 'ö', 'ü', 'Ä', 'Ö', 'Ü', 'ß']

interface Props {
  task: ListenConfirmTask
  onComplete: (result: TaskResult) => void
}

export default function ListenConfirm({ task, onComplete }: Props) {
  const [input, setInput] = useState('')
  const [played, setPlayed] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [showTranslation, setShowTranslation] = useState(false)
  const { speak } = useTTS()

  function handlePlay() {
    speak(task.german, 'de-DE')
    setPlayed(true)
  }

  function handleSubmit() {
    if (!input.trim() || status === 'correct') return
    const newAttempts = attempts + 1
    setAttempts(newAttempts)

    const isCorrect =
      input.trim().toLowerCase() === task.confirmWord.toLowerCase()

    if (isCorrect) {
      setStatus('correct')
      setTimeout(() => onComplete({ correct: true, attempts: newAttempts }), 1000)
    } else {
      setStatus('wrong')
      setTimeout(() => {
        setStatus('idle')
        setInput('')
      }, 800)
    }
  }

  function insertUmlaut(char: string) {
    setInput((prev) => prev + char)
  }

  return (
    <div className="exercise-container">
      <p className="text-slate-400 text-sm text-center uppercase tracking-wide">Listen & Confirm</p>

      {/* Instructions */}
      <div className="card p-5 w-full text-center space-y-2">
        <p className="text-slate-300 text-sm">
          You'll hear a German sentence. Listen carefully and type the missing word!
        </p>
        <p className="text-slate-400 text-sm italic">
          "{task.english}"
        </p>
      </div>

      {/* Play button */}
      <motion.button
        whileTap={{ scale: 0.93 }}
        className={`w-full py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 transition-all
          ${played
            ? 'bg-blue-700 hover:bg-blue-600 border border-blue-500'
            : 'bg-blue-500 hover:bg-blue-600 border-2 border-blue-400 shadow-lg shadow-blue-500/30'}`}
        onClick={handlePlay}
      >
        🔊 {played ? 'Play Again' : 'Listen!'}
      </motion.button>

      {played && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full space-y-3"
        >
          <p className="text-slate-300 text-center text-sm">
            Type the word: <span className="text-amber-300 font-semibold">«{task.confirmWord}»</span>
          </p>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Type the word you heard..."
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

          {/* Reveal translation hint */}
          {!showTranslation && attempts >= 2 && (
            <button
              className="text-amber-400 text-sm underline w-full text-center"
              onClick={() => setShowTranslation(true)}
            >
              💡 Show full sentence
            </button>
          )}
          {showTranslation && (
            <p className="text-amber-300 text-sm text-center">
              🇩🇪 "{task.german}"
            </p>
          )}

          <AnimatePresence>
            {status === 'correct' && (
              <motion.p
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-green-400 font-bold text-lg text-center"
              >
                ✅ Perfekt! (Perfect!)
              </motion.p>
            )}
            {status === 'wrong' && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-red-400 text-sm text-center">
                Not quite — listen again and try!
              </motion.p>
            )}
          </AnimatePresence>

          <button
            className="btn-primary w-full"
            onClick={handleSubmit}
            disabled={!input.trim() || status === 'correct'}
          >
            Confirm ✓
          </button>
        </motion.div>
      )}
    </div>
  )
}

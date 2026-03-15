import { useState } from 'react'
import { motion } from 'framer-motion'
import type { FlashcardTask, TaskResult } from '../../types/curriculum'
import { useTTS } from '../../hooks/useTTS'
import { useSFX } from '../../hooks/useSFX'
import { useConfetti } from '../../hooks/useConfetti'

interface Props {
  task: FlashcardTask
  onComplete: (result: TaskResult) => void
}

export default function Flashcard({ task, onComplete }: Props) {
  const [flipped, setFlipped] = useState(false)
  const [answered, setAnswered] = useState(false)
  const { speak } = useTTS()
  const { play } = useSFX()
  const { burstSmall } = useConfetti()

  function handleFlip() {
    const next = !flipped
    setFlipped(next)
    play('buttonClick')
    if (task.tts && next) speak(task.german, 'de-DE')
  }

  function handleResponse() {
    if (answered) return
    setAnswered(true)
    play('correctDing')
    burstSmall()
    onComplete({ correct: true, attempts: 1, taskType: 'flashcard', expectedAnswer: task.german })
  }

  function handleTTS(e: React.MouseEvent) {
    e.stopPropagation()
    speak(task.german, 'de-DE')
  }

  return (
    <div className="exercise-container">
      <p className="text-slate-400 text-sm text-center uppercase tracking-wide">Flashcard</p>
      <p className="text-slate-300 text-center text-base">
        Tap the card to flip between German and English!
      </p>

      {/* Flip card */}
      <div
        className="perspective w-full cursor-pointer"
        style={{ height: '220px' }}
        onClick={!answered ? handleFlip : undefined}
      >
        <div className={`flip-card-inner w-full h-full ${flipped ? 'flipped' : ''}`}>
          {/* Front */}
          <div className="flip-card-front card w-full h-full flex flex-col items-center justify-center gap-2 p-6 border-2 border-blue-500">
            <span className="text-5xl">{task.emoji ?? '🇩🇪'}</span>
            <p className="text-3xl font-bold text-white mt-2">{task.german}</p>
            <p className="text-slate-400 text-sm mt-1">Tap to see meaning</p>
          </div>

          {/* Back */}
          <div className="flip-card-back card w-full h-full flex flex-col items-center justify-center gap-2 p-6 bg-slate-700 border-2 border-amber-400">
            <span className="text-5xl">{task.emoji ?? '💡'}</span>
            <p className="text-3xl font-bold text-amber-300 mt-2">{task.english}</p>
            {task.hint && (
              <p className="text-slate-400 text-sm text-center mt-1">💡 {task.hint}</p>
            )}
            <button
              className="mt-2 text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
              onClick={handleTTS}
            >
              🔊 Hear it in German
            </button>
            {!answered && (
              <p className="text-slate-500 text-xs mt-1">← Tap card to flip back</p>
            )}
          </div>
        </div>
      </div>

      {/* Response buttons — only show after flip */}
      {flipped && !answered && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full mt-2"
        >
          <button
            className="w-full bg-green-500 hover:bg-green-600 active:scale-95 text-white font-bold py-3 px-4 rounded-xl transition-all"
            onClick={handleResponse}
          >
            ✅ Got it!
          </button>
        </motion.div>
      )}

      {answered && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-slate-400 text-sm text-center"
        >
          Moving on...
        </motion.p>
      )}
    </div>
  )
}

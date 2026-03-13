import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { getLessonTasks, getChapterForLesson, isChapterComplete } from '../../services/curriculum'
import ExerciseRouter from '../exercises/ExerciseRouter'
import type { TaskResult } from '../../types/curriculum'

export default function LessonView() {
  const {
    activeLessonId,
    activeTaskIndex,
    taskResults,
    completedLessons,
    recordTaskResult,
    finishLesson,
    setScreen,
    collectedCards,
    debugAllUnlocked,
  } = useGameStore()

  const [vocabOpen, setVocabOpen] = useState(false)

  const tasks = activeLessonId ? getLessonTasks(activeLessonId) : []
  const totalTasks = tasks.length
  const progress = totalTasks > 0 ? (activeTaskIndex / totalTasks) * 100 : 0
  const currentTask = tasks[activeTaskIndex]

  // Advance to results when all tasks done
  useEffect(() => {
    if (activeLessonId && activeTaskIndex >= totalTasks && totalTasks > 0) {
      // Check if chapter becomes newly complete → queue card unlock
      const info = getChapterForLesson(activeLessonId)
      if (info) {
        const alreadyCollected = collectedCards.includes(info.chapter.id)
        const nowComplete = isChapterComplete(info.chapter.id, {
          ...completedLessons,
          [activeLessonId]: true,
        })
        if (nowComplete && !alreadyCollected) {
          useGameStore.setState({ pendingCardUnlock: info.chapter.id })
        }
      }
      finishLesson(activeLessonId, totalTasks)
    }
  }, [activeTaskIndex, totalTasks, activeLessonId])

  function handleTaskComplete(result: TaskResult) {
    recordTaskResult(result)
  }

  if (!activeLessonId || tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-slate-400">No lesson selected.</p>
        <button className="btn-secondary" onClick={() => setScreen('map')}>← Back to Map</button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <button
          className="text-slate-400 hover:text-white text-2xl"
          onClick={() => setScreen('map')}
          title="Exit lesson"
        >
          ✕
        </button>
        <div className="flex-1 bg-slate-700 rounded-full h-3 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
        <span className="text-slate-400 text-sm whitespace-nowrap">
          {activeTaskIndex}/{totalTasks}
        </span>
        <button
          className="text-slate-400 hover:text-amber-300 text-lg transition-colors"
          onClick={() => setVocabOpen(true)}
          title="Look up vocabulary"
        >
          📖
        </button>
      </div>

      {/* Task area */}
      <div className="flex-1 overflow-y-auto flex items-center justify-center py-4">
        <AnimatePresence mode="wait">
          {currentTask && (
            <motion.div
              key={activeTaskIndex}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.25 }}
              className="w-full"
            >
              <ExerciseRouter task={currentTask} onComplete={handleTaskComplete} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Debug: skip task */}
      {debugAllUnlocked && currentTask && (
        <div className="px-4 pb-2 flex justify-center">
          <button
            className="bg-purple-700/80 hover:bg-purple-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
            onClick={() => handleTaskComplete({ correct: true, attempts: 1, taskType: currentTask.type })}
          >
            ⏭ Skip Task
          </button>
        </div>
      )}

      {/* Streak indicator */}
      {taskResults.length > 0 && (() => {
        const last3 = taskResults.slice(-3)
        const streak = last3.filter(r => r.correct && r.attempts === 1).length
        if (streak >= 2) {
          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center pb-2 text-amber-400 text-sm"
            >
              🔥 {streak} in a row!
            </motion.div>
          )
        }
        return null
      })()}

      {/* Vocab lookup panel */}
      <AnimatePresence>
        {vocabOpen && (() => {
          const vocabItems = tasks.filter(
            t => t.type === 'flashcard' || t.type === 'listen-confirm'
          ) as Array<{ type: 'flashcard'; german: string; english: string; emoji?: string } | { type: 'listen-confirm'; german: string; english: string }>

          return (
            <>
              {/* Backdrop */}
              <motion.div
                key="vocab-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 z-10"
                onClick={() => setVocabOpen(false)}
              />
              {/* Sheet */}
              <motion.div
                key="vocab-sheet"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="absolute bottom-0 left-0 right-0 bg-slate-800 rounded-t-2xl z-20 max-h-[70%] flex flex-col"
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
                  <h2 className="text-white font-bold text-lg">📖 Vocab Reference</h2>
                  <button
                    className="text-slate-400 hover:text-white text-2xl leading-none"
                    onClick={() => setVocabOpen(false)}
                  >
                    ✕
                  </button>
                </div>
                {vocabItems.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-8">No vocabulary in this lesson yet.</p>
                ) : (
                  <ul className="overflow-y-auto px-4 py-3 flex flex-col gap-2">
                    {vocabItems.map((item, i) => (
                      <li key={i} className="flex items-center justify-between bg-slate-700 rounded-xl px-4 py-3">
                        <span className="text-white font-semibold">
                          {'emoji' in item && item.emoji ? `${item.emoji} ` : ''}{item.german}
                        </span>
                        <span className="text-slate-300 text-sm">{item.english}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            </>
          )
        })()}
      </AnimatePresence>
    </div>
  )
}

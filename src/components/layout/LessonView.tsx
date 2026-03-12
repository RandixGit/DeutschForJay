import { useEffect } from 'react'
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
  } = useGameStore()

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
    <div className="flex flex-col h-full">
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
    </div>
  )
}

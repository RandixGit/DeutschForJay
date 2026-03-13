import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore, getLevel } from '../../store/gameStore'
import { ALL_MODULES } from '../../services/curriculum'
import type { Module, Chapter, Lesson } from '../../types/curriculum'

export default function ModuleMap() {
  const { xp, completedLessons, struggledLessons, startLesson, setScreen, playerName, switchPlayer, players } = useGameStore()
  const { current: lvl } = getLevel(xp)

  const [selectedModule, setSelectedModule] = useState<Module | null>(null)
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null)

  function isModuleUnlocked(mod: Module) {
    return xp >= mod.xpRequired
  }

  function isLessonCompleted(lessonId: string) {
    return lessonId in completedLessons
  }

  function getLessonStars(lessonId: string) {
    return completedLessons[lessonId]?.stars ?? 0
  }

  function isLessonStruggled(lessonId: string) {
    return struggledLessons.includes(lessonId)
  }

  function isChapterAllDone(chapter: Chapter) {
    return chapter.lessons.every((l) => isLessonCompleted(l.id))
  }

  function getChapterProgress(chapter: Chapter) {
    const done = chapter.lessons.filter((l) => isLessonCompleted(l.id)).length
    return `${done}/${chapter.lessons.length}`
  }

  function handleStartLesson(lesson: Lesson) {
    startLesson(lesson.id)
  }

  // Drill-down: nothing selected → modules list
  //             module selected → chapters list
  //             chapter selected → lessons list

  if (selectedChapter && selectedModule) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-4 pt-4 pb-2 flex items-center gap-2">
          <button
            className="text-slate-400 hover:text-white text-lg"
            onClick={() => setSelectedChapter(null)}
          >
            ← Back
          </button>
          <h2 className="text-white font-bold text-lg ml-2">{selectedChapter.title}</h2>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">
          {selectedChapter.lessons.map((lesson, idx) => {
            const done = isLessonCompleted(lesson.id)
            const stars = getLessonStars(lesson.id)
            const struggled = isLessonStruggled(lesson.id)
            return (
              <motion.button
                key={lesson.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`w-full card p-4 text-left flex items-center gap-4 transition-all
                  ${done ? 'border border-green-600/50' : 'border border-slate-700 hover:border-blue-500'}`}
                onClick={() => handleStartLesson(lesson)}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0
                  ${done ? 'bg-green-600' : 'bg-blue-600'}`}>
                  {done ? '✓' : idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate">{lesson.title}</p>
                  {done && (
                    <p className="text-sm mt-0.5">
                      <span className="text-amber-400">{'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}</span>
                      {struggled && <span className="text-orange-400 ml-2">📝 Review</span>}
                    </p>
                  )}
                  {!done && (
                    <p className="text-slate-400 text-sm">{lesson.tasks.length} exercises</p>
                  )}
                </div>
                <span className="text-slate-400 text-lg shrink-0">
                  {done ? '🔄' : '▶'}
                </span>
              </motion.button>
            )
          })}
        </div>
      </div>
    )
  }

  if (selectedModule) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-4 pt-4 pb-2 flex items-center gap-2">
          <button
            className="text-slate-400 hover:text-white text-lg"
            onClick={() => setSelectedModule(null)}
          >
            ← Back
          </button>
          <div className="ml-2">
            <h2 className="text-white font-bold text-lg">{selectedModule.title}</h2>
            <p className="text-slate-400 text-xs">{selectedModule.theme}</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">
          {selectedModule.chapters.map((chapter, idx) => {
            const allDone = isChapterAllDone(chapter)
            const progress = getChapterProgress(chapter)
            return (
              <motion.button
                key={chapter.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.07 }}
                className={`w-full card p-4 text-left flex items-center gap-4 transition-all
                  hover:border-blue-500 ${allDone ? 'border border-green-600/60' : 'border border-slate-700'}`}
                onClick={() => setSelectedChapter(chapter)}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0
                  ${allDone ? 'bg-green-700' : 'bg-slate-700'}`}>
                  {allDone ? '🏆' : selectedModule.badge.icon}
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold">{chapter.title}</p>
                  <p className="text-slate-400 text-sm">Progress: {progress} lessons</p>
                </div>
                <span className="text-slate-400">›</span>
              </motion.button>
            )
          })}
        </div>
      </div>
    )
  }

  // Top-level module list
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white font-bold text-xl">Deutsch für {playerName} 🇩🇪</h1>
            <p className="text-slate-400 text-sm">{lvl.icon} {lvl.name} · {xp} XP</p>
          </div>
          <div className="flex items-center gap-1">
            {Object.keys(players).length > 1 && (
              <button
                className="text-slate-400 hover:text-white text-xl"
                onClick={switchPlayer}
                title="Switch Player"
              >
                👥
              </button>
            )}
            <button
              className="text-slate-400 hover:text-white text-2xl"
              onClick={() => setScreen('parent')}
              title="Parent Dashboard"
            >
              👨‍👩‍👦
            </button>
          </div>
        </div>
      </div>

      {/* Struggled lessons banner */}
      {struggledLessons.length > 0 && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-orange-900/30 border border-orange-700">
          <p className="text-orange-300 text-sm">
            📝 You have {struggledLessons.length} lesson{struggledLessons.length > 1 ? 's' : ''} to review!
          </p>
        </div>
      )}

      {/* Modules */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 mt-3 space-y-4">
        {ALL_MODULES.map((mod, idx) => {
          const unlocked = isModuleUnlocked(mod)
          const totalLessons = mod.chapters.reduce((s, c) => s + c.lessons.length, 0)
          const doneLessons = mod.chapters.reduce(
            (s, c) => s + c.lessons.filter((l) => isLessonCompleted(l.id)).length, 0
          )
          const pct = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0

          return (
            <motion.button
              key={mod.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: unlocked ? 1 : 0.5, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              disabled={!unlocked}
              className={`w-full card p-5 text-left transition-all
                ${unlocked ? 'hover:border-blue-500 cursor-pointer' : 'cursor-not-allowed opacity-50'}
                border ${pct === 100 ? 'border-green-600/60' : 'border-slate-700'}`}
              onClick={() => unlocked && setSelectedModule(mod)}
            >
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0
                  ${unlocked ? 'bg-slate-700' : 'bg-slate-800'}`}>
                  {unlocked ? mod.badge.icon : '🔒'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-base">{mod.title}</p>
                  <p className="text-slate-400 text-sm truncate">{mod.description}</p>
                  {!unlocked && (
                    <p className="text-amber-400 text-xs mt-1">
                      🔒 Need {mod.xpRequired} XP (you have {xp})
                    </p>
                  )}
                </div>
              </div>

              {unlocked && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>{doneLessons}/{totalLessons} lessons</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="bg-slate-700 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.3 + idx * 0.1, duration: 0.6 }}
                    />
                  </div>
                </div>
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

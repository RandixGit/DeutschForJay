import type { Module, Lesson, Task } from '../types/curriculum'

// Auto-discover all module JSON files — just drop a new module-XX.json and it's picked up
const moduleFiles = import.meta.glob('../curriculum/module-*.json', { eager: true })
export const ALL_MODULES: Module[] = Object.values(moduleFiles)
  .map(m => (m as { default: Module }).default)
  .sort((a, b) => a.xpRequired - b.xpRequired)

export function getModule(moduleId: string): Module | undefined {
  return ALL_MODULES.find((m) => m.id === moduleId)
}

export function getLesson(lessonId: string): Lesson | undefined {
  for (const mod of ALL_MODULES) {
    for (const ch of mod.chapters) {
      for (const ls of ch.lessons) {
        if (ls.id === lessonId) return ls
      }
    }
  }
  return undefined
}

export function getLessonTasks(lessonId: string): Task[] {
  return getLesson(lessonId)?.tasks ?? []
}

/** Returns the chapter that contains this lesson */
export function getChapterForLesson(lessonId: string) {
  for (const mod of ALL_MODULES) {
    for (const ch of mod.chapters) {
      for (const ls of ch.lessons) {
        if (ls.id === lessonId) return { module: mod, chapter: ch }
      }
    }
  }
  return null
}

/** Returns all lesson IDs in a chapter */
export function getLessonsInChapter(chapterId: string): Lesson[] {
  for (const mod of ALL_MODULES) {
    const ch = mod.chapters.find((c) => c.id === chapterId)
    if (ch) return ch.lessons
  }
  return []
}

/** True if all lessons in a chapter are completed */
export function isChapterComplete(
  chapterId: string,
  completedLessons: Record<string, unknown>
): boolean {
  const lessons = getLessonsInChapter(chapterId)
  return lessons.length > 0 && lessons.every((l) => l.id in completedLessons)
}

export type TaskType = 'flashcard' | 'multiple-choice' | 'fill-in-blank' | 'listen-confirm' | 'word-order'

export interface FlashcardTask {
  type: 'flashcard'
  german: string
  english: string
  hint?: string
  emoji?: string
  tts: boolean
}

export interface MultipleChoiceTask {
  type: 'multiple-choice'
  prompt: string
  promptLanguage?: 'en' | 'de'
  options: string[]
  correct: number
  explanation?: string
}

export interface FillInBlankTask {
  type: 'fill-in-blank'
  sentence: string   // use ___ as placeholder
  answer: string     // the word(s) that fill the blank
  hint?: string
  tts?: boolean
}

export interface ListenConfirmTask {
  type: 'listen-confirm'
  german: string
  english: string
  confirmWord: string  // user must type this (case-insensitive) to confirm
}

export interface WordOrderTask {
  type: 'word-order'
  prompt: string                // instruction in English, e.g. "Put the words in the right order"
  correctOrder: string[]        // words in the correct German order
  english: string               // English translation shown as hint
  tts?: boolean
}

export type Task =
  | FlashcardTask
  | MultipleChoiceTask
  | FillInBlankTask
  | ListenConfirmTask
  | WordOrderTask

export interface TaskResult {
  correct: boolean
  attempts: number  // how many tries it took
  taskType: TaskType
  wrongAnswers?: string[]  // actual wrong inputs submitted by the student
  expectedAnswer?: string  // the correct answer for this task
}

export interface Lesson {
  id: string
  title: string
  tasks: Task[]
}

export interface Chapter {
  id: string
  title: string
  lessons: Lesson[]
}

export interface Badge {
  name: string
  icon: string
}

export interface Module {
  id: string
  title: string
  theme: string
  description: string
  xpRequired: number
  badge: Badge
  chapters: Chapter[]
}

export type TaskType = 'flashcard' | 'multiple-choice' | 'fill-in-blank' | 'listen-confirm' | 'word-order' | 'letter-scramble' | 'syllable-builder'

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
  promptImage?: string       // URL for an image shown above the prompt
  options: string[]
  optionImages?: string[]    // URLs for images on each option button
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
  question: string     // comprehension question shown after listening
  options: string[]    // 4 multiple-choice answers
  correct: number      // 0-based index of the correct option
}

export interface WordOrderTask {
  type: 'word-order'
  prompt: string                // instruction in English, e.g. "Put the words in the right order"
  correctOrder: string[]        // words in the correct German order
  english: string               // English translation shown as hint
  tts?: boolean
}

export interface LetterScrambleTask {
  type: 'letter-scramble'
  prompt: string        // e.g. "Spell the German word for 'Hello'"
  answer: string        // e.g. "Hallo"
  hint?: string
  tts?: boolean
}

export interface SyllableBuilderTask {
  type: 'syllable-builder'
  prompt: string        // e.g. "Build: 'Good morning'"
  syllables: string[]   // e.g. ["Mor", "Gu", "ten", "gen"]
  answer: string        // e.g. "Guten Morgen"
  tts?: boolean
}

export type Task =
  | FlashcardTask
  | MultipleChoiceTask
  | FillInBlankTask
  | ListenConfirmTask
  | WordOrderTask
  | LetterScrambleTask
  | SyllableBuilderTask

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

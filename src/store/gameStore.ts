import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TaskResult } from '../types/curriculum'

export type { TaskResult }
export type Screen = 'welcome' | 'map' | 'lesson' | 'results' | 'card-unlock' | 'parent'

export interface Coupon {
  id: string
  description: string
  earnedAt: string   // ISO date string
  paidOut: boolean
  paidOutAt?: string
}

export interface LessonResult {
  lessonId: string
  score: number      // 0–100
  stars: number      // 1–3
  xpEarned: number
  completedAt: string
}

interface GameState {
  // Navigation
  screen: Screen

  // Player
  playerName: string | null

  // Active lesson
  activeLessonId: string | null
  activeTaskIndex: number
  taskResults: TaskResult[]

  // Persistent progress
  xp: number
  completedLessons: Record<string, LessonResult>  // lessonId → result
  struggledLessons: string[]
  collectedCards: string[]    // chapterId list of unlocked collectible cards
  currentStreak: number
  lastPlayedDate: string | null

  // Parent
  parentPin: string | null
  coupons: Coupon[]

  // Transient (not persisted — reset after navigation)
  lastLessonResult: LessonResult | null
  pendingCardUnlock: string | null   // chapterId if a card was just unlocked

  // Actions
  setScreen: (screen: Screen) => void
  setPlayerName: (name: string) => void
  startLesson: (lessonId: string) => void
  recordTaskResult: (result: TaskResult) => void
  finishLesson: (lessonId: string, totalTasks: number) => void
  collectCard: (chapterId: string) => void
  setParentPin: (pin: string) => void
  addCoupon: (description: string) => void
  markCouponPaid: (couponId: string) => void
  resetProgress: () => void
}

const XP_PER_CORRECT_FIRST_TRY = 10
const XP_PER_CORRECT_WITH_RETRY = 5
const LESSON_BONUS_3_STARS = 50
const LESSON_BONUS_2_STARS = 25
const LESSON_BONUS_1_STAR = 10

function calcStars(taskResults: TaskResult[]): { stars: number; score: number } {
  if (taskResults.length === 0) return { stars: 1, score: 0 }
  const firstTryCorrect = taskResults.filter(r => r.correct && r.attempts === 1).length
  const score = Math.round((firstTryCorrect / taskResults.length) * 100)
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : score >= 50 ? 1 : 1
  return { stars, score }
}

function calcXP(taskResults: TaskResult[], stars: number): number {
  const taskXP = taskResults.reduce((sum, r) => {
    if (!r.correct) return sum
    return sum + (r.attempts === 1 ? XP_PER_CORRECT_FIRST_TRY : XP_PER_CORRECT_WITH_RETRY)
  }, 0)
  const bonus =
    stars === 3 ? LESSON_BONUS_3_STARS :
    stars === 2 ? LESSON_BONUS_2_STARS :
    LESSON_BONUS_1_STAR
  return taskXP + bonus
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // Navigation
      screen: 'welcome',

      // Player
      playerName: null,

      // Active lesson
      activeLessonId: null,
      activeTaskIndex: 0,
      taskResults: [],

      // Progress
      xp: 0,
      completedLessons: {},
      struggledLessons: [],
      collectedCards: [],
      currentStreak: 0,
      lastPlayedDate: null,

      // Parent
      parentPin: null,
      coupons: [],

      // Transient
      lastLessonResult: null,
      pendingCardUnlock: null,

      setScreen: (screen) => set({ screen }),
      setPlayerName: (name) => set({ playerName: name, screen: 'map' }),

      startLesson: (lessonId) =>
        set({
          activeLessonId: lessonId,
          activeTaskIndex: 0,
          taskResults: [],
          screen: 'lesson',
        }),

      recordTaskResult: (result) =>
        set((state) => ({
          taskResults: [...state.taskResults, result],
          activeTaskIndex: state.activeTaskIndex + 1,
        })),

      finishLesson: (lessonId, totalTasks) => {
        const state = get()
        const { stars, score } = calcStars(state.taskResults)
        const xpEarned = calcXP(state.taskResults, stars)

        const lessonResult: LessonResult = {
          lessonId,
          score,
          stars,
          xpEarned,
          completedAt: new Date().toISOString(),
        }

        const isStruggled = score < 50
        const newStruggled = isStruggled
          ? [...new Set([...state.struggledLessons, lessonId])]
          : state.struggledLessons.filter((id) => id !== lessonId)

        const today = new Date().toDateString()
        const lastDate = state.lastPlayedDate
        const streak =
          lastDate === today
            ? state.currentStreak
            : lastDate === new Date(Date.now() - 86400000).toDateString()
            ? state.currentStreak + 1
            : 1

        set({
          completedLessons: { ...state.completedLessons, [lessonId]: lessonResult },
          struggledLessons: newStruggled,
          xp: state.xp + xpEarned,
          lastLessonResult: lessonResult,
          currentStreak: streak,
          lastPlayedDate: today,
          screen: 'results',
        })
      },

      collectCard: (chapterId) =>
        set((state) => ({
          collectedCards: [...new Set([...state.collectedCards, chapterId])],
          pendingCardUnlock: null,
        })),

      setParentPin: (pin) => set({ parentPin: pin }),

      addCoupon: (description) =>
        set((state) => ({
          coupons: [
            ...state.coupons,
            {
              id: `coupon-${Date.now()}`,
              description,
              earnedAt: new Date().toISOString(),
              paidOut: false,
            },
          ],
        })),

      markCouponPaid: (couponId) =>
        set((state) => ({
          coupons: state.coupons.map((c) =>
            c.id === couponId
              ? { ...c, paidOut: true, paidOutAt: new Date().toISOString() }
              : c
          ),
        })),

      resetProgress: () =>
        set({
          xp: 0,
          completedLessons: {},
          struggledLessons: [],
          collectedCards: [],
          currentStreak: 0,
          lastPlayedDate: null,
          coupons: [],
          screen: 'map',
        }),
    }),
    {
      name: 'deutsch-for-jay-progress',
      // Don't persist transient fields
      partialize: (state) => ({
        playerName: state.playerName,
        xp: state.xp,
        completedLessons: state.completedLessons,
        struggledLessons: state.struggledLessons,
        collectedCards: state.collectedCards,
        currentStreak: state.currentStreak,
        lastPlayedDate: state.lastPlayedDate,
        parentPin: state.parentPin,
        coupons: state.coupons,
      }),
    }
  )
)

// XP level thresholds
export const XP_LEVELS = [
  { level: 1, name: 'Rookie', icon: '⚽', minXP: 0 },
  { level: 2, name: 'Ball Boy', icon: '🌟', minXP: 100 },
  { level: 3, name: 'Midfielder', icon: '🏆', minXP: 300 },
  { level: 4, name: 'Striker', icon: '⚡', minXP: 600 },
  { level: 5, name: 'Captain', icon: '👑', minXP: 1000 },
  { level: 6, name: 'Pro Player', icon: '🔥', minXP: 1500 },
  { level: 7, name: 'World Class', icon: '💎', minXP: 2500 },
  { level: 8, name: 'Legend', icon: '🌈', minXP: 4000 },
]

export function getLevel(xp: number) {
  let current = XP_LEVELS[0]
  for (const lvl of XP_LEVELS) {
    if (xp >= lvl.minXP) current = lvl
  }
  const idx = XP_LEVELS.indexOf(current)
  const next = XP_LEVELS[idx + 1] ?? null
  const progress = next
    ? ((xp - current.minXP) / (next.minXP - current.minXP)) * 100
    : 100
  return { current, next, progress: Math.min(100, Math.round(progress)) }
}

export const GERMAN_FACTS = [
  'German is spoken by over 100 million people worldwide! 🌍',
  'Germany has won the FIFA World Cup 4 times! ⚽🏆',
  'The word "Kindergarten" is German and literally means "children\'s garden"! 🌱',
  '"Doppelgänger" is a German word meaning your look-alike double! 👥',
  'Germans love soccer — they call it "Fußball"! ⚽',
  'The famous game Gummy Bears were invented in Germany! 🐻',
  '"Wanderlust" is a German word meaning the desire to travel! ✈️',
  'Germany has over 1,500 different types of beer! 🍺 (maybe when you\'re older 😄)',
  'The first printed book (Gutenberg Bible) was made in Germany! 📚',
  '"Angst" is a German word now used in English too! 😱',
]

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TaskResult } from '../types/curriculum'

export type { TaskResult }
export type Screen = 'welcome' | 'player-select' | 'map' | 'lesson' | 'results' | 'card-unlock' | 'parent'

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
  taskResults?: TaskResult[]  // per-task detail for curriculum generation analysis
}

export interface PlayerProfile {
  id: string
  name: string
  xp: number
  completedLessons: Record<string, LessonResult>
  struggledLessons: string[]
  collectedCards: string[]
  currentStreak: number
  lastPlayedDate: string | null
  coupons: Coupon[]
}

interface GameState {
  // Navigation
  screen: Screen

  // Multi-player
  players: Record<string, PlayerProfile>
  activePlayerId: string | null

  // Player (flat, mirrors active player for component compatibility)
  playerName: string | null

  // Active lesson
  activeLessonId: string | null
  activeTaskIndex: number
  taskResults: TaskResult[]

  // Persistent progress (mirrors active player)
  xp: number
  completedLessons: Record<string, LessonResult>  // lessonId → result
  struggledLessons: string[]
  collectedCards: string[]    // chapterId list of unlocked collectible cards
  currentStreak: number
  lastPlayedDate: string | null

  // Parent
  parentPin: string | null
  coupons: Coupon[]

  // Hydration flag (set to true by onRehydrateStorage, never persisted)
  _hydrated: boolean

  // Transient (not persisted — reset after navigation)
  lastLessonResult: LessonResult | null
  pendingCardUnlock: string | null   // chapterId if a card was just unlocked
  debugAllUnlocked: boolean          // parent review mode — bypass module XP locks

  // Actions
  setScreen: (screen: Screen) => void
  setPlayerName: (name: string) => void
  createPlayer: (name: string) => void
  selectPlayer: (id: string) => void
  switchPlayer: () => void
  startLesson: (lessonId: string) => void
  recordTaskResult: (result: TaskResult) => void
  finishLesson: (lessonId: string, totalTasks: number) => void
  collectCard: (chapterId: string) => void
  setParentPin: (pin: string) => void
  addCoupon: (description: string) => void
  markCouponPaid: (couponId: string) => void
  resetProgress: () => void
  resetProgressForPlayer: (id: string) => void
  markCouponPaidForPlayer: (playerId: string, couponId: string) => void
  debugUnlockAllModules: () => void
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

function extractProfile(id: string, state: GameState): PlayerProfile {
  return {
    id,
    name: state.playerName ?? '',
    xp: state.xp,
    completedLessons: state.completedLessons,
    struggledLessons: state.struggledLessons,
    collectedCards: state.collectedCards,
    currentStreak: state.currentStreak,
    lastPlayedDate: state.lastPlayedDate,
    coupons: state.coupons,
  }
}

function profileToFlatFields(p: PlayerProfile) {
  return {
    playerName: p.name,
    xp: p.xp,
    completedLessons: p.completedLessons,
    struggledLessons: p.struggledLessons,
    collectedCards: p.collectedCards,
    currentStreak: p.currentStreak,
    lastPlayedDate: p.lastPlayedDate,
    coupons: p.coupons,
  }
}

const blankProfileFields = {
  xp: 0,
  completedLessons: {} as Record<string, LessonResult>,
  struggledLessons: [] as string[],
  collectedCards: [] as string[],
  currentStreak: 0,
  lastPlayedDate: null as string | null,
  coupons: [] as Coupon[],
}

// Captured during store creation to avoid TDZ self-reference in onRehydrateStorage
let _set: ((partial: Partial<GameState>) => void) | null = null

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => {
      _set = set as (partial: Partial<GameState>) => void
      return ({
      // Navigation
      screen: 'welcome',

      // Multi-player
      players: {},
      activePlayerId: null,

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

      // Hydration flag
      _hydrated: false,

      // Transient
      lastLessonResult: null,
      pendingCardUnlock: null,
      debugAllUnlocked: false,

      setScreen: (screen) => set({ screen }),

      setPlayerName: (name) => {
        // Legacy: treat as createPlayer if no active player
        const state = get()
        if (!state.activePlayerId) {
          const id = crypto.randomUUID()
          const profile: PlayerProfile = { id, name, ...blankProfileFields }
          set({
            players: { ...state.players, [id]: profile },
            activePlayerId: id,
            playerName: name,
            ...blankProfileFields,
            screen: 'map',
          })
        } else {
          const state2 = get()
          const pid = state2.activePlayerId!
          const updated = { ...state2.players[pid], name }
          set({
            playerName: name,
            players: { ...state2.players, [pid]: updated },
          })
        }
      },

      createPlayer: (name) => {
        const state = get()
        const id = crypto.randomUUID()
        const profile: PlayerProfile = { id, name, ...blankProfileFields }
        set({
          players: { ...state.players, [id]: profile },
          activePlayerId: id,
          playerName: name,
          ...blankProfileFields,
          screen: 'map',
        })
      },

      selectPlayer: (id) => {
        const state = get()
        const profile = state.players[id]
        if (!profile) return
        set({
          activePlayerId: id,
          ...profileToFlatFields(profile),
          screen: 'map',
        })
      },

      switchPlayer: () => {
        const state = get()
        if (state.activePlayerId) {
          const updated = extractProfile(state.activePlayerId, state)
          set({
            players: { ...state.players, [state.activePlayerId]: updated },
            activePlayerId: null,
            screen: 'player-select',
          })
        } else {
          set({ screen: 'player-select' })
        }
      },

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
          taskResults: state.taskResults,
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

        const newCompletedLessons = { ...state.completedLessons, [lessonId]: lessonResult }
        const newXP = state.xp + xpEarned

        const updatedProfileFields = {
          xp: newXP,
          completedLessons: newCompletedLessons,
          struggledLessons: newStruggled,
          currentStreak: streak,
          lastPlayedDate: today,
        }

        const newPlayers = state.activePlayerId
          ? {
              ...state.players,
              [state.activePlayerId]: {
                ...extractProfile(state.activePlayerId, state),
                ...updatedProfileFields,
              },
            }
          : state.players

        set({
          completedLessons: newCompletedLessons,
          struggledLessons: newStruggled,
          xp: newXP,
          lastLessonResult: lessonResult,
          currentStreak: streak,
          lastPlayedDate: today,
          screen: 'results',
          players: newPlayers,
        })
      },

      collectCard: (chapterId) => {
        const state = get()
        const newCards = [...new Set([...state.collectedCards, chapterId])]
        const newPlayers = state.activePlayerId
          ? {
              ...state.players,
              [state.activePlayerId]: {
                ...extractProfile(state.activePlayerId, state),
                collectedCards: newCards,
              },
            }
          : state.players
        set({
          collectedCards: newCards,
          pendingCardUnlock: null,
          players: newPlayers,
        })
      },

      setParentPin: (pin) => set({ parentPin: pin }),

      addCoupon: (description) => {
        const state = get()
        const newCoupon: Coupon = {
          id: `coupon-${Date.now()}`,
          description,
          earnedAt: new Date().toISOString(),
          paidOut: false,
        }
        const newCoupons = [...state.coupons, newCoupon]
        const newPlayers = state.activePlayerId
          ? {
              ...state.players,
              [state.activePlayerId]: {
                ...extractProfile(state.activePlayerId, state),
                coupons: newCoupons,
              },
            }
          : state.players
        set({ coupons: newCoupons, players: newPlayers })
      },

      markCouponPaid: (couponId) => {
        const state = get()
        const newCoupons = state.coupons.map((c) =>
          c.id === couponId
            ? { ...c, paidOut: true, paidOutAt: new Date().toISOString() }
            : c
        )
        const newPlayers = state.activePlayerId
          ? {
              ...state.players,
              [state.activePlayerId]: {
                ...extractProfile(state.activePlayerId, state),
                coupons: newCoupons,
              },
            }
          : state.players
        set({ coupons: newCoupons, players: newPlayers })
      },

      resetProgress: () => {
        const state = get()
        if (state.activePlayerId) {
          const resetFields = { ...blankProfileFields }
          const updatedProfile = {
            ...state.players[state.activePlayerId],
            ...resetFields,
          }
          set({
            ...resetFields,
            players: { ...state.players, [state.activePlayerId]: updatedProfile },
            screen: 'map',
          })
        } else {
          set({ ...blankProfileFields, screen: 'map' })
        }
      },

      markCouponPaidForPlayer: (playerId, couponId) => {
        const state = get()
        const profile = state.players[playerId]
        if (!profile) return
        const newCoupons = profile.coupons.map((c) =>
          c.id === couponId
            ? { ...c, paidOut: true, paidOutAt: new Date().toISOString() }
            : c
        )
        const updatedProfile = { ...profile, coupons: newCoupons }
        const newPlayers = { ...state.players, [playerId]: updatedProfile }
        if (playerId === state.activePlayerId) {
          set({ coupons: newCoupons, players: newPlayers })
        } else {
          set({ players: newPlayers })
        }
      },

      resetProgressForPlayer: (id) => {
        const state = get()
        const profile = state.players[id]
        if (!profile) return
        const resetProfile = { ...profile, ...blankProfileFields }
        const newPlayers = { ...state.players, [id]: resetProfile }
        if (id === state.activePlayerId) {
          set({ ...blankProfileFields, players: newPlayers })
        } else {
          set({ players: newPlayers })
        }
      },

      debugUnlockAllModules: () => {
        set((state) => ({ debugAllUnlocked: !state.debugAllUnlocked }))
      },
    })
    },
    {
      name: 'deutsch-for-jay-progress',
      partialize: (state) => ({
        players: state.players,
        activePlayerId: state.activePlayerId,
        parentPin: state.parentPin,
        // Keep legacy fields for migration detection
        playerName: state.playerName,
        xp: state.xp,
        completedLessons: state.completedLessons,
        struggledLessons: state.struggledLessons,
        collectedCards: state.collectedCards,
        currentStreak: state.currentStreak,
        lastPlayedDate: state.lastPlayedDate,
        coupons: state.coupons,
      }),
      onRehydrateStorage: () => (state) => {
        try {
          if (!state) return
          // Migrate old single-player format (no players map)
          if (
            state.playerName &&
            (!state.players || Object.keys(state.players).length === 0)
          ) {
            const id = crypto.randomUUID()
            const profile: PlayerProfile = {
              id,
              name: state.playerName,
              xp: state.xp ?? 0,
              completedLessons: state.completedLessons ?? {},
              struggledLessons: state.struggledLessons ?? [],
              collectedCards: state.collectedCards ?? [],
              currentStreak: state.currentStreak ?? 0,
              lastPlayedDate: state.lastPlayedDate ?? null,
              coupons: state.coupons ?? [],
            }
            _set?.({
              players: { [id]: profile },
              activePlayerId: id,
              screen: 'map',
              ...profileToFlatFields(profile),
            })
          } else if (state.activePlayerId && state.players?.[state.activePlayerId]) {
            // Normal load: populate flat fields from active player
            const p = state.players[state.activePlayerId]
            _set?.({ ...profileToFlatFields(p), screen: 'map' })
          }
        } catch (e) {
          console.error('[gameStore] rehydration error:', e)
        } finally {
          _set?.({ _hydrated: true })
        }
      },
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

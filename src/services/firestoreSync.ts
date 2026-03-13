import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import type { PlayerProfile, Coupon, LessonResult } from '../store/gameStore'

/** Shape of what we persist to Firestore (mirrors zustand partialize) */
export interface PersistedState {
  players: Record<string, PlayerProfile>
  activePlayerId: string | null
  parentPin: string | null
  playerName: string | null
  xp: number
  completedLessons: Record<string, LessonResult>
  struggledLessons: string[]
  collectedCards: string[]
  currentStreak: number
  lastPlayedDate: string | null
  coupons: Coupon[]
}

function userDocRef(uid: string) {
  return doc(db, 'users', uid)
}

/** Load persisted game state from Firestore */
export async function loadFromFirestore(uid: string): Promise<PersistedState | null> {
  try {
    const snap = await getDoc(userDocRef(uid))
    if (!snap.exists()) return null
    return snap.data() as PersistedState
  } catch (err) {
    console.error('[firestoreSync] load error:', err)
    return null
  }
}

/** Save current game state to Firestore */
export async function saveToFirestore(uid: string, state: PersistedState): Promise<void> {
  try {
    await setDoc(userDocRef(uid), state, { merge: true })
  } catch (err) {
    console.error('[firestoreSync] save error:', err)
  }
}

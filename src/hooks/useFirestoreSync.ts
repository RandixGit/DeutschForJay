import { useEffect, useRef } from 'react'
import { useAuth } from '../services/AuthContext'
import { useGameStore } from '../store/gameStore'
import { loadFromFirestore, saveToFirestore, type PersistedState } from '../services/firestoreSync'

/**
 * Syncs zustand game state with Firestore when user is authenticated.
 * Guests use localStorage only (handled by zustand persist middleware).
 */
export function useFirestoreSync() {
  const { user } = useAuth()
  const hydrated = useGameStore((s) => s._hydrated)
  const loadedRef = useRef(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load from Firestore on sign-in
  useEffect(() => {
    if (!user || !hydrated || loadedRef.current) return
    loadedRef.current = true

    loadFromFirestore(user.uid).then((remote) => {
      if (!remote) return

      // Merge: if remote has players, use them (remote wins)
      const local = useGameStore.getState()
      const remotePlayers = remote.players ?? {}
      const localPlayers = local.players ?? {}

      // Merge player maps (remote wins on conflicts)
      const mergedPlayers = { ...localPlayers, ...remotePlayers }

      useGameStore.setState({
        players: mergedPlayers,
        activePlayerId: remote.activePlayerId ?? local.activePlayerId,
        parentPin: remote.parentPin ?? local.parentPin,
        playerName: remote.playerName ?? local.playerName,
        xp: remote.xp ?? local.xp,
        completedLessons: remote.completedLessons ?? local.completedLessons,
        struggledLessons: remote.struggledLessons ?? local.struggledLessons,
        collectedCards: remote.collectedCards ?? local.collectedCards,
        currentStreak: remote.currentStreak ?? local.currentStreak,
        lastPlayedDate: remote.lastPlayedDate ?? local.lastPlayedDate,
        coupons: remote.coupons ?? local.coupons,
      })
    })
  }, [user, hydrated])

  // Reset load flag on sign-out
  useEffect(() => {
    if (!user) loadedRef.current = false
  }, [user])

  // Save to Firestore on state changes (debounced)
  useEffect(() => {
    if (!user) return

    const unsub = useGameStore.subscribe((state) => {
      if (!user) return

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        const s = state
        const data: PersistedState = {
          players: s.players,
          activePlayerId: s.activePlayerId,
          parentPin: s.parentPin,
          playerName: s.playerName,
          xp: s.xp,
          completedLessons: s.completedLessons,
          struggledLessons: s.struggledLessons,
          collectedCards: s.collectedCards,
          currentStreak: s.currentStreak,
          lastPlayedDate: s.lastPlayedDate,
          coupons: s.coupons,
        }
        saveToFirestore(user.uid, data)
      }, 1000) // 1s debounce
    })

    return () => {
      unsub()
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [user])
}

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth'
import { auth, googleProvider } from './firebase'

interface AuthState {
  user: User | null
  isGuest: boolean
  loading: boolean
  authError: string | null
  signInWithGoogle: () => Promise<void>
  continueAsGuest: () => void
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isGuest, setIsGuest] = useState(false)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    const wasGuest = localStorage.getItem('deutsch-auth-guest') === 'true'
    if (wasGuest) {
      setIsGuest(true)
    }

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      if (u) {
        setIsGuest(false)
        localStorage.removeItem('deutsch-auth-guest')
      }
      setLoading(false)
    })
    return unsub
  }, [])

  async function signInWithGoogle() {
    setAuthError(null)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      if (result.user) {
        setUser(result.user)
        localStorage.removeItem('deutsch-auth-guest')
        setIsGuest(false)
      }
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string }
      console.error('Google sign-in failed:', error)
      if (error.code === 'auth/popup-closed-by-user') return
      setAuthError(error.message || 'Sign-in failed. Please try again.')
    }
  }

  function continueAsGuest() {
    localStorage.setItem('deutsch-auth-guest', 'true')
    setIsGuest(true)
  }

  async function signOut() {
    if (user) {
      await fbSignOut(auth)
    }
    localStorage.removeItem('deutsch-auth-guest')
    setUser(null)
    setIsGuest(false)
  }

  return (
    <AuthContext.Provider value={{ user, isGuest, loading, authError, signInWithGoogle, continueAsGuest, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

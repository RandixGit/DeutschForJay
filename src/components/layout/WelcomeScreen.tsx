import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'

export default function WelcomeScreen() {
  const createPlayer = useGameStore((s) => s.createPlayer)
  const [name, setName] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed) createPlayer(trimmed)
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6 w-full max-w-xs"
      >
        <div className="text-6xl">🇩🇪</div>
        <div>
          <h1 className="text-white font-bold text-2xl">Willkommen!</h1>
          <p className="text-slate-400 text-sm mt-1">What's your name?</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            className="w-full bg-slate-800 text-white text-center text-lg font-semibold rounded-xl px-4 py-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            maxLength={30}
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Let's go! ⚽
          </button>
        </form>
      </motion.div>
    </div>
  )
}

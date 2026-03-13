import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore, getLevel } from '../../store/gameStore'

export default function PlayerSelectScreen() {
  const players = useGameStore((s) => s.players)
  const createPlayer = useGameStore((s) => s.createPlayer)
  const selectPlayer = useGameStore((s) => s.selectPlayer)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const playerList = Object.values(players)

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed) createPlayer(trimmed)
  }

  return (
    <div className="flex flex-col items-center h-full px-4 py-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-xs"
      >
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🇩🇪</div>
          <h1 className="text-white font-bold text-xl mb-1">Wer spielt?</h1>
          <p className="text-slate-400 text-sm">Who's playing?</p>
        </div>

        <div className="space-y-3">
          {playerList.map((player, idx) => {
            const { current } = getLevel(player.xp)
            const lessonCount = Object.keys(player.completedLessons).length
            return (
              <motion.button
                key={player.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.07 }}
                onClick={() => selectPlayer(player.id)}
                className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 flex items-center gap-3 text-left transition-colors"
              >
                <span className="text-2xl">{current.icon}</span>
                <div className="flex-1">
                  <div className="text-white font-semibold">{player.name}</div>
                  <div className="text-slate-400 text-xs">
                    {player.xp} XP · {lessonCount} {lessonCount === 1 ? 'lesson' : 'lessons'}
                  </div>
                </div>
                <span className="text-slate-500 text-sm">▶</span>
              </motion.button>
            )
          })}

          {!adding ? (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: playerList.length * 0.07 }}
              onClick={() => setAdding(true)}
              className="w-full border border-dashed border-slate-600 hover:border-blue-500 text-slate-400 hover:text-blue-400 rounded-xl py-3 text-sm font-medium transition-colors"
            >
              + Add Player
            </motion.button>
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleCreate}
              className="space-y-2"
            >
              <input
                type="text"
                autoFocus
                maxLength={30}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Player name"
                className="w-full bg-slate-800 text-white text-center text-lg font-semibold rounded-xl px-4 py-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setAdding(false); setName('') }}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl py-2 text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-xl py-2 text-sm transition-colors"
                >
                  Create ⚽
                </button>
              </div>
            </motion.form>
          )}
        </div>
      </motion.div>
    </div>
  )
}

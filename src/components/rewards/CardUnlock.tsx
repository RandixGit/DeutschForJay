import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { ALL_MODULES } from '../../services/curriculum'

// Soccer/One Piece themed card art
const CARD_THEMES = [
  { bg: 'from-blue-600 to-blue-900', emoji: '⚽', title: 'Soccer Star', subtitle: 'Kickin\' it in German!' },
  { bg: 'from-amber-500 to-orange-700', emoji: '🏴‍☠️', title: 'Pirate Scholar', subtitle: 'On to the next island!' },
  { bg: 'from-purple-600 to-purple-900', emoji: '🎮', title: 'Roblox Champion', subtitle: 'Level up your German!' },
  { bg: 'from-red-600 to-red-900', emoji: '⚡', title: 'Lightning Striker', subtitle: 'Schnell! (Fast!)' },
  { bg: 'from-green-500 to-green-800', emoji: '🌟', title: 'Golden Boot', subtitle: 'Du bist super! (You\'re super!)' },
  { bg: 'from-cyan-500 to-blue-700', emoji: '🐉', title: 'Dragon Warrior', subtitle: 'Mut! (Courage!)' },
]

export default function CardUnlock() {
  const { pendingCardUnlock, collectCard, setScreen } = useGameStore()
  const [revealed, setRevealed] = useState(false)

  const chapter = pendingCardUnlock
    ? ALL_MODULES.flatMap((m) => m.chapters).find((c) => c.id === pendingCardUnlock)
    : null

  // Pick a stable card theme based on chapter id hash
  const themeIdx = pendingCardUnlock
    ? pendingCardUnlock.split('').reduce((s, c) => s + c.charCodeAt(0), 0) % CARD_THEMES.length
    : 0
  const theme = CARD_THEMES[themeIdx]

  function handleReveal() {
    setRevealed(true)
  }

  function handleCollect() {
    if (pendingCardUnlock) collectCard(pendingCardUnlock)
    setScreen('map')
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 gap-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <p className="text-amber-400 font-bold text-lg uppercase tracking-wide">
          🎴 New Card Unlocked!
        </p>
        <p className="text-slate-400 text-sm mt-1">
          You completed: <span className="text-white">{chapter?.title ?? 'a chapter'}</span>
        </p>
      </motion.div>

      {/* Card */}
      <div className="perspective w-64" style={{ height: '360px' }}>
        <div
          className={`flip-card-inner w-full h-full cursor-pointer ${revealed ? 'flipped' : ''}`}
          onClick={!revealed ? handleReveal : undefined}
        >
          {/* Back of card (shown first) */}
          <div className="flip-card-front card w-full h-full flex flex-col items-center justify-center bg-slate-800 border-2 border-blue-500">
            <div className="text-6xl mb-4">🇩🇪</div>
            <p className="text-blue-400 font-bold text-xl">Deutsch für Jay</p>
            <p className="text-slate-400 text-sm mt-2">Tap to reveal your card!</p>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="mt-4 text-3xl"
            >
              ✨
            </motion.div>
          </div>

          {/* Front of card */}
          <div
            className={`flip-card-back card w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b ${theme.bg} border-2 border-amber-400`}
          >
            <p className="text-7xl mb-3">{theme.emoji}</p>
            <p className="text-white font-bold text-xl text-center">{theme.title}</p>
            <p className="text-white/80 text-sm text-center mt-1">{theme.subtitle}</p>
            <div className="mt-4 px-3 py-1 bg-black/30 rounded-full">
              <p className="text-amber-300 text-xs">
                {chapter?.title ?? 'Chapter Complete'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {revealed && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="btn-success w-full max-w-xs text-lg py-4"
            onClick={handleCollect}
          >
            🎉 Add to Collection!
          </motion.button>
        )}
        {!revealed && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-slate-400 text-sm"
          >
            Tap the card to reveal your reward!
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

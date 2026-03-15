import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const MESSAGES = [
  { text: 'Toll gemacht!', sub: 'Well done!' },
  { text: 'Weiter so!', sub: 'Keep going!' },
  { text: 'Super!', sub: 'Super!' },
  { text: 'Genau richtig!', sub: 'Exactly right!' },
  { text: 'Klasse!', sub: 'Great!' },
  { text: 'Du bist super!', sub: "You're super!" },
  { text: 'Perfekt!', sub: 'Perfect!' },
  { text: 'TOOOR!', sub: 'GOOOAL!' },
]

interface Props {
  show: boolean
  onDone?: () => void
}

export default function MascotBubble({ show, onDone }: Props) {
  const [msg] = useState(() => MESSAGES[Math.floor(Math.random() * MESSAGES.length)])

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => onDone?.(), 2000)
      return () => clearTimeout(timer)
    }
  }, [show])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: -10 }}
          transition={{ type: 'spring', damping: 15, stiffness: 300 }}
          className="fixed bottom-20 right-4 z-50 flex items-end gap-2 pointer-events-none"
        >
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl px-4 py-2 shadow-lg max-w-[180px]">
            <p className="text-white font-bold text-sm">{msg.text}</p>
            <p className="text-white/80 text-xs">{msg.sub}</p>
          </div>
          <div className="text-3xl">⚽</div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

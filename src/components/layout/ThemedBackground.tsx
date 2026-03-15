import { motion } from 'framer-motion'

const FLOATING_ITEMS = [
  { emoji: '⚽', x: '10%', delay: 0, duration: 18 },
  { emoji: '🌟', x: '80%', delay: 3, duration: 22 },
  { emoji: '⚡', x: '25%', delay: 7, duration: 20 },
  { emoji: '🏴\u200d☠️', x: '65%', delay: 11, duration: 24 },
  { emoji: '🎮', x: '45%', delay: 5, duration: 19 },
  { emoji: '⚽', x: '90%', delay: 14, duration: 21 },
]

export default function ThemedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden>
      {FLOATING_ITEMS.map((item, i) => (
        <motion.div
          key={i}
          className="absolute text-2xl opacity-[0.06]"
          style={{ left: item.x }}
          initial={{ y: '110vh', rotate: 0 }}
          animate={{
            y: '-10vh',
            rotate: 360,
          }}
          transition={{
            duration: item.duration,
            delay: item.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {item.emoji}
        </motion.div>
      ))}
    </div>
  )
}

import { motion } from 'framer-motion'

interface Props {
  amount: number
  onComplete?: () => void
}

export default function FloatingXP({ amount, onComplete }: Props) {
  return (
    <motion.div
      initial={{ opacity: 1, y: 0, scale: 0.8 }}
      animate={{ opacity: 0, y: -60, scale: 1.3 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      onAnimationComplete={onComplete}
      className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none z-50"
    >
      <span className="text-amber-400 font-bold text-lg drop-shadow-lg">
        +{amount} XP
      </span>
    </motion.div>
  )
}

import { motion } from 'framer-motion'

interface Props {
  total: number      // total lessons in chapter
  completed: number  // completed lessons
  hasCard: boolean   // card already collected
}

export default function FragmentProgress({ total, completed, hasCard }: Props) {
  if (hasCard) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-amber-400 text-xs font-bold">🎴 Collected</span>
      </div>
    )
  }

  // Show up to 3 fragment pieces that fill based on progress
  const fragments = 3
  const progressPer = total > 0 ? completed / total : 0
  const filledFragments = Math.min(fragments, Math.floor(progressPer * fragments))
  // If all lessons done but fragments shows 2, bump to 3
  const displayFilled = completed >= total ? fragments : filledFragments

  return (
    <div className="flex items-center gap-1">
      {[...Array(fragments)].map((_, i) => (
        <motion.div
          key={i}
          initial={false}
          animate={{
            scale: i < displayFilled ? 1 : 0.8,
            opacity: i < displayFilled ? 1 : 0.3,
          }}
          className={`w-5 h-5 rounded flex items-center justify-center text-xs ${
            i < displayFilled
              ? 'bg-amber-500 text-white'
              : 'bg-slate-600 text-slate-400'
          }`}
        >
          {i < displayFilled ? '⭐' : '?'}
        </motion.div>
      ))}
      <span className="text-slate-400 text-[10px] ml-1">
        {displayFilled}/{fragments}
      </span>
    </div>
  )
}

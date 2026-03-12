import { motion } from 'framer-motion'
import { useGameStore, getLevel } from '../../store/gameStore'

export default function XPBar() {
  const xp = useGameStore((s) => s.xp)
  const { current, next, progress } = getLevel(xp)

  return (
    <div className="px-4 py-2 flex items-center gap-3">
      <span className="text-xl shrink-0" title={current.name}>{current.icon}</span>
      <div className="flex-1">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>{current.name}</span>
          {next && <span>{xp}/{next.minXP} XP</span>}
          {!next && <span>Max Level! {xp} XP</span>}
        </div>
        <div className="bg-slate-700 rounded-full h-2.5 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>
      {next && <span className="text-xl shrink-0 opacity-40" title={next.name}>{next.icon}</span>}
    </div>
  )
}

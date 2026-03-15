import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getFunContent, type FunContent } from '../../services/funContent'
import { useSFX } from '../../hooks/useSFX'

interface Props {
  onDismiss: () => void
}

export default function FunBreak({ onDismiss }: Props) {
  const [content, setContent] = useState<FunContent | null>(null)
  const [imgLoaded, setImgLoaded] = useState(false)
  const { play } = useSFX()

  useEffect(() => {
    play('streakChime')
    getFunContent().then(setContent)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto px-4"
    >
      <div className="card p-5 w-full bg-gradient-to-b from-indigo-900/50 to-slate-800 border border-indigo-500/50">
        <p className="text-indigo-300 text-xs uppercase tracking-wider text-center font-bold mb-3">
          {content?.type === 'joke' ? '😂 Joke Break!' : content?.type === 'image' ? '🐾 Cute Break!' : '🧠 Fun Fact!'}
        </p>

        {!content && (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {content?.type === 'image' && content.imageUrl && (
          <div className="relative rounded-xl overflow-hidden mb-3">
            {!imgLoaded && (
              <div className="w-full h-40 bg-slate-700 animate-pulse rounded-xl" />
            )}
            <img
              src={content.imageUrl}
              alt="Fun break"
              className={`w-full max-h-48 object-cover rounded-xl ${imgLoaded ? '' : 'hidden'}`}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgLoaded(true)}
            />
          </div>
        )}

        {content?.text && (
          <p className="text-slate-200 text-sm text-center leading-relaxed whitespace-pre-line">
            {content.text}
          </p>
        )}
      </div>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="btn-primary px-8 py-3 text-base"
        onClick={() => {
          play('buttonClick')
          onDismiss()
        }}
      >
        Cool! Keep going! 🚀
      </motion.button>
    </motion.div>
  )
}

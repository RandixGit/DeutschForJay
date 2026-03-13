import { useCallback } from 'react'
import confetti from 'canvas-confetti'

export function useConfetti() {
  const burstSmall = useCallback(() => {
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.7 },
      colors: ['#22c55e', '#4ade80', '#86efac', '#fbbf24'],
      scalar: 0.8,
    })
  }, [])

  const burstBig = useCallback((stars = 3) => {
    const count = stars === 3 ? 200 : stars === 2 ? 120 : 60

    // Left cannon
    confetti({
      particleCount: Math.floor(count / 2),
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      colors: ['#fbbf24', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7'],
    })

    // Right cannon
    confetti({
      particleCount: Math.floor(count / 2),
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      colors: ['#fbbf24', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7'],
    })
  }, [])

  const burstGold = useCallback(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.5 },
      colors: ['#fbbf24', '#f59e0b', '#d97706', '#fcd34d'],
      shapes: ['circle', 'square'],
      scalar: 1.1,
      gravity: 0.8,
    })
  }, [])

  const burstFire = useCallback(() => {
    confetti({
      particleCount: 60,
      angle: 90,
      spread: 40,
      origin: { y: 0.8 },
      colors: ['#ef4444', '#f97316', '#eab308', '#fbbf24'],
      startVelocity: 45,
      gravity: 1.2,
    })
  }, [])

  const burstRainbow = useCallback(() => {
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899']

    // Center burst
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      colors,
      scalar: 1.2,
    })

    // Delayed side bursts
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 40,
        origin: { x: 0.1, y: 0.7 },
        colors,
      })
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 40,
        origin: { x: 0.9, y: 0.7 },
        colors,
      })
    }, 200)
  }, [])

  return { burstSmall, burstBig, burstGold, burstFire, burstRainbow }
}

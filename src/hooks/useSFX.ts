import { useCallback } from 'react'
import { useGameStore } from '../store/gameStore'

export type SFXName =
  | 'correctDing'
  | 'wrongBuzz'
  | 'streakChime'
  | 'fanfare'
  | 'cardReveal'
  | 'levelUp'
  | 'buttonClick'

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  type: OscillatorType,
  startTime: number,
  duration: number,
  volume = 0.3,
) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(frequency, startTime)
  gain.gain.setValueAtTime(volume, startTime)
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(startTime)
  osc.stop(startTime + duration)
}

const SFX_FUNCTIONS: Record<SFXName, (ctx: AudioContext) => void> = {
  correctDing(ctx) {
    const t = ctx.currentTime
    playTone(ctx, 523.25, 'sine', t, 0.12, 0.25) // C5
    playTone(ctx, 659.25, 'sine', t + 0.1, 0.15, 0.25) // E5
  },

  wrongBuzz(ctx) {
    const t = ctx.currentTime
    playTone(ctx, 150, 'square', t, 0.2, 0.12)
  },

  streakChime(ctx) {
    const t = ctx.currentTime
    playTone(ctx, 523.25, 'sine', t, 0.12, 0.2) // C5
    playTone(ctx, 659.25, 'sine', t + 0.08, 0.12, 0.2) // E5
    playTone(ctx, 783.99, 'sine', t + 0.16, 0.18, 0.25) // G5
  },

  fanfare(ctx) {
    const t = ctx.currentTime
    playTone(ctx, 523.25, 'sine', t, 0.18, 0.2) // C5
    playTone(ctx, 659.25, 'sine', t + 0.15, 0.18, 0.2) // E5
    playTone(ctx, 783.99, 'sine', t + 0.3, 0.18, 0.25) // G5
    playTone(ctx, 1046.5, 'sine', t + 0.45, 0.35, 0.3) // C6

    // Add a subtle harmony
    playTone(ctx, 392.0, 'triangle', t + 0.45, 0.35, 0.1) // G4 harmony
  },

  cardReveal(ctx) {
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(800, t)
    osc.frequency.exponentialRampToValueAtTime(3000, t + 0.4)
    gain.gain.setValueAtTime(0.15, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5)

    // Tremolo via LFO
    const lfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()
    lfo.frequency.setValueAtTime(20, t)
    lfoGain.gain.setValueAtTime(0.08, t)
    lfo.connect(lfoGain)
    lfoGain.connect(gain.gain)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.5)
    lfo.start(t)
    lfo.stop(t + 0.5)
  },

  levelUp(ctx) {
    const t = ctx.currentTime
    const notes = [261.63, 329.63, 392.0, 523.25] // C4, E4, G4, C5
    notes.forEach((freq, i) => {
      playTone(ctx, freq, 'sine', t + i * 0.13, 0.25, 0.25)
      playTone(ctx, freq * 1.5, 'triangle', t + i * 0.13, 0.25, 0.08) // fifth harmony
    })
  },

  buttonClick(ctx) {
    const t = ctx.currentTime
    playTone(ctx, 1000, 'sine', t, 0.03, 0.15)
  },
}

export function useSFX() {
  const soundEnabled = useGameStore((s) => s.soundEnabled)

  const play = useCallback(
    (name: SFXName) => {
      if (!soundEnabled) return
      try {
        const ctx = getAudioContext()
        SFX_FUNCTIONS[name](ctx)
      } catch {
        // Silently fail — audio is non-critical
      }
    },
    [soundEnabled],
  )

  return { play }
}

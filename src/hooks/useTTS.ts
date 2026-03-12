import { useCallback, useRef } from 'react'

export function useTTS() {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const speak = useCallback((text: string, lang: 'de-DE' | 'en-US' = 'de-DE') => {
    if (!window.speechSynthesis) return

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = 0.85   // slightly slower for learning
    utterance.pitch = 1.0

    // Try to find a matching voice
    const voices = window.speechSynthesis.getVoices()
    const match = voices.find(
      (v) => v.lang.startsWith(lang.split('-')[0]) && v.lang === lang
    ) ?? voices.find(
      (v) => v.lang.startsWith(lang.split('-')[0])
    )
    if (match) utterance.voice = match

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }, [])

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel()
  }, [])

  const isSpeaking = useCallback(() => {
    return window.speechSynthesis?.speaking ?? false
  }, [])

  return { speak, stop, isSpeaking }
}

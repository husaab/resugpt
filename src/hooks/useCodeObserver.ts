'use client'

import { useEffect, useRef } from 'react'
import type { CodeContextSnapshot } from '@/types/interviewRealtime'

export type { CodeContextSnapshot }

interface UseCodeObserverOptions {
  code: string
  language: string
  enabled: boolean
  onCodeSnapshot: (snapshot: CodeContextSnapshot) => void
  debounceMs?: number
  starterCode?: string
}

export function useCodeObserver({
  code,
  language,
  enabled,
  onCodeSnapshot,
  debounceMs = 6000,
  starterCode,
}: UseCodeObserverOptions) {
  const lastSentCodeRef = useRef<string>('')
  const lastLanguageRef = useRef<string>(language)
  const hasSentFirstRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // callbackRef pattern — avoids stale closures in the debounce timer
  const callbackRef = useRef(onCodeSnapshot)
  callbackRef.current = onCodeSnapshot

  // Reset state when language changes or when disabled (round transition)
  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      lastSentCodeRef.current = ''
      hasSentFirstRef.current = false
      return
    }

    if (language !== lastLanguageRef.current) {
      lastSentCodeRef.current = ''
      hasSentFirstRef.current = false
      lastLanguageRef.current = language
    }
  }, [enabled, language])

  // Debounced code observation
  useEffect(() => {
    if (!enabled) return

    // Skip if code matches starter/default code
    if (starterCode && code === starterCode) return

    // Skip empty code
    if (!code.trim()) return

    // Clear previous timer
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => {
      // Dedup — skip if code hasn't changed since last send
      if (code === lastSentCodeRef.current) return

      const isFirstSnapshot = !hasSentFirstRef.current
      lastSentCodeRef.current = code
      hasSentFirstRef.current = true

      callbackRef.current({
        code,
        language,
        isFirstSnapshot,
      })
    }, debounceMs)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [code, language, enabled, debounceMs, starterCode])
}

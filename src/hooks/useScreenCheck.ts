'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import type { UseScreenCheckReturn } from '@/types/interviewRealtime'

export function useScreenCheck(): UseScreenCheckReturn {
  const [hasScreenPermission, setHasScreenPermission] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRequesting, setIsRequesting] = useState(false)

  const screenStreamRef = useRef<MediaStream | null>(null)

  const isSupported = typeof navigator !== 'undefined'
    && typeof navigator.mediaDevices !== 'undefined'
    && 'getDisplayMedia' in navigator.mediaDevices

  const requestScreen = useCallback(async () => {
    if (!isSupported) {
      setError('Screen recording is not supported in this browser.')
      return
    }

    try {
      setIsRequesting(true)
      setError(null)

      // preferCurrentTab is a Chrome-only hint — try with it first, fallback without
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: 30 },
          audio: false,
          // @ts-expect-error — preferCurrentTab is non-standard (Chrome 94+)
          preferCurrentTab: true,
        })
      } catch {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: 30 },
          audio: false,
        })
      }

      screenStreamRef.current = stream
      setHasScreenPermission(true)

      // Listen for user stopping the screen share via browser UI
      stream.getVideoTracks()[0]?.addEventListener('ended', () => {
        screenStreamRef.current = null
        setHasScreenPermission(false)
      })
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        // User dismissed the picker — not an error, just skipped
        setError(null)
      } else {
        setError('Failed to start screen recording. Please try again.')
      }
    } finally {
      setIsRequesting(false)
    }
  }, [isSupported])

  const stopScreenCheck = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop())
      screenStreamRef.current = null
    }
    setHasScreenPermission(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  return { hasScreenPermission, screenStreamRef, error, isRequesting, isSupported, requestScreen, stopScreenCheck }
}

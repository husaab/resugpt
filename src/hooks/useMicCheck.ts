'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import type { UseMicCheckReturn } from '@/types/interviewRealtime'

export function useMicCheck(): UseMicCheckReturn {
  const [hasMicPermission, setHasMicPermission] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number | null>(null)

  const pollAudioLevel = useCallback(() => {
    const analyser = analyserRef.current
    if (!analyser) return

    const data = new Uint8Array(analyser.frequencyBinCount)
    analyser.getByteFrequencyData(data)

    // Average frequency amplitude → normalize to 0–1
    const sum = data.reduce((acc, val) => acc + val, 0)
    const avg = sum / data.length
    setAudioLevel(avg / 255)

    rafRef.current = requestAnimationFrame(pollAudioLevel)
  }, [])

  const requestMic = useCallback(async () => {
    try {
      setIsChecking(true)
      setError(null)

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const ctx = new AudioContext()
      audioContextRef.current = ctx

      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser

      setHasMicPermission(true)
      rafRef.current = requestAnimationFrame(pollAudioLevel)
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('Microphone access was denied. Please allow mic access in your browser settings and reload.')
      } else if (err instanceof DOMException && err.name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone and try again.')
      } else {
        setError('Failed to access microphone. Please check your device settings.')
      }
      setIsChecking(false)
    }
  }, [pollAudioLevel])

  const stopMicCheck = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    analyserRef.current = null
    setAudioLevel(0)
    setIsChecking(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      audioContextRef.current?.close()
    }
  }, [])

  return { hasMicPermission, audioLevel, isChecking, error, requestMic, stopMicCheck }
}

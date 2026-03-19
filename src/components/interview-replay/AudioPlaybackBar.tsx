'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { PlayIcon, PauseIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/solid'

interface AudioPlaybackBarProps {
  userAudioUrl: string | null
  aiAudioUrl: string | null
  currentTime: number
  duration: number
  isPlaying: boolean
  onPlayPause: () => void
  onTimeUpdate: (time: number) => void
  onDurationResolved: (duration: number) => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function AudioPlaybackBar({
  userAudioUrl,
  aiAudioUrl,
  currentTime,
  duration,
  isPlaying,
  onPlayPause,
  onTimeUpdate,
  onDurationResolved,
}: AudioPlaybackBarProps) {
  const userAudioRef = useRef<HTMLAudioElement | null>(null)
  const aiAudioRef = useRef<HTMLAudioElement | null>(null)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const seekingRef = useRef(false)

  // Create audio elements
  useEffect(() => {
    if (userAudioUrl) {
      const el = new Audio(userAudioUrl)
      el.preload = 'metadata'
      userAudioRef.current = el

      el.addEventListener('loadedmetadata', () => {
        if (el.duration && isFinite(el.duration)) {
          onDurationResolved(Math.max(duration, el.duration))
        }
      })

      return () => {
        el.pause()
        el.src = ''
        userAudioRef.current = null
      }
    }
  }, [userAudioUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (aiAudioUrl) {
      const el = new Audio(aiAudioUrl)
      el.preload = 'metadata'
      aiAudioRef.current = el

      el.addEventListener('loadedmetadata', () => {
        if (el.duration && isFinite(el.duration)) {
          onDurationResolved(Math.max(duration, el.duration))
        }
      })

      return () => {
        el.pause()
        el.src = ''
        aiAudioRef.current = null
      }
    }
  }, [aiAudioUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync play/pause
  useEffect(() => {
    const play = async (el: HTMLAudioElement | null) => {
      if (!el) return
      try { await el.play() } catch { /* autoplay may be blocked */ }
    }

    if (isPlaying) {
      play(userAudioRef.current)
      play(aiAudioRef.current)
    } else {
      userAudioRef.current?.pause()
      aiAudioRef.current?.pause()
    }
  }, [isPlaying])

  // Drive currentTime from the primary audio track
  useEffect(() => {
    const primary = userAudioRef.current || aiAudioRef.current
    if (!primary) return

    const handler = () => {
      if (!seekingRef.current) {
        onTimeUpdate(primary.currentTime)
      }
    }
    primary.addEventListener('timeupdate', handler)
    return () => primary.removeEventListener('timeupdate', handler)
  }, [userAudioUrl, aiAudioUrl, onTimeUpdate])

  // Sync volume
  useEffect(() => {
    const vol = isMuted ? 0 : volume
    if (userAudioRef.current) userAudioRef.current.volume = vol
    if (aiAudioRef.current) aiAudioRef.current.volume = vol
  }, [volume, isMuted])

  // Seek both tracks
  const seekTo = useCallback((time: number) => {
    seekingRef.current = true
    if (userAudioRef.current) userAudioRef.current.currentTime = time
    if (aiAudioRef.current) aiAudioRef.current.currentTime = time
    onTimeUpdate(time)
    // Small delay to prevent timeupdate from overwriting
    setTimeout(() => { seekingRef.current = false }, 100)
  }, [onTimeUpdate])

  // Handle ended
  useEffect(() => {
    const primary = userAudioRef.current || aiAudioRef.current
    if (!primary) return

    const handler = () => onPlayPause() // pause when done
    primary.addEventListener('ended', handler)
    return () => primary.removeEventListener('ended', handler)
  }, [userAudioUrl, aiAudioUrl, onPlayPause])

  if (!userAudioUrl && !aiAudioUrl) return null

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl">
      {/* Play/Pause */}
      <button
        onClick={onPlayPause}
        className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--accent-color)] text-white hover:opacity-90 transition-opacity shrink-0"
      >
        {isPlaying ? (
          <PauseIcon className="w-4 h-4" />
        ) : (
          <PlayIcon className="w-4 h-4 ml-0.5" />
        )}
      </button>

      {/* Time */}
      <span className="text-xs font-mono text-[var(--text-tertiary)] w-10 text-right shrink-0">
        {formatTime(currentTime)}
      </span>

      {/* Seek bar */}
      <input
        type="range"
        min={0}
        max={duration || 1}
        step={0.1}
        value={currentTime}
        onChange={(e) => seekTo(parseFloat(e.target.value))}
        className="flex-1 h-1.5 rounded-full appearance-none bg-[var(--bg-muted)] cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--accent-color)]
          [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-pointer"
      />

      <span className="text-xs font-mono text-[var(--text-tertiary)] w-10 shrink-0">
        {formatTime(duration)}
      </span>

      {/* Volume */}
      <button
        onClick={() => setIsMuted((m) => !m)}
        className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors shrink-0"
      >
        {isMuted || volume === 0 ? (
          <SpeakerXMarkIcon className="w-4 h-4" />
        ) : (
          <SpeakerWaveIcon className="w-4 h-4" />
        )}
      </button>
    </div>
  )
}

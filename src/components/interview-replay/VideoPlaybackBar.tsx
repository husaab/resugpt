'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import {
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  VideoCameraIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/solid'

interface VideoPlaybackBarProps {
  videoRef: React.RefObject<HTMLVideoElement | null>
  userAudioUrl: string | null
  aiAudioUrl: string | null
  currentTime: number
  duration: number
  isPlaying: boolean
  onPlayPause: () => void
  onTimeUpdate: (time: number) => void
  onDurationResolved: (duration: number) => void
  hasScreenRecording: boolean
  activeTrack: 'camera' | 'screen'
  onTrackSwitch: (track: 'camera' | 'screen') => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function VideoPlaybackBar({
  videoRef,
  userAudioUrl,
  aiAudioUrl,
  currentTime,
  duration,
  isPlaying,
  onPlayPause,
  onTimeUpdate,
  onDurationResolved,
  hasScreenRecording,
  activeTrack,
  onTrackSwitch,
}: VideoPlaybackBarProps) {
  const userAudioRef = useRef<HTMLAudioElement | null>(null)
  const aiAudioRef = useRef<HTMLAudioElement | null>(null)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const seekingRef = useRef(false)

  // Create audio elements for user/AI audio tracks
  useEffect(() => {
    if (userAudioUrl) {
      const el = new Audio(userAudioUrl)
      el.preload = 'metadata'
      userAudioRef.current = el
      return () => {
        el.pause()
        el.src = ''
        userAudioRef.current = null
      }
    }
  }, [userAudioUrl])

  useEffect(() => {
    if (aiAudioUrl) {
      const el = new Audio(aiAudioUrl)
      el.preload = 'metadata'
      aiAudioRef.current = el
      return () => {
        el.pause()
        el.src = ''
        aiAudioRef.current = null
      }
    }
  }, [aiAudioUrl])

  // Resolve duration from video
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const handler = () => {
      if (video.duration && isFinite(video.duration)) {
        onDurationResolved(Math.max(duration, video.duration))
      }
    }
    video.addEventListener('loadedmetadata', handler)
    return () => video.removeEventListener('loadedmetadata', handler)
  }, [videoRef, duration, onDurationResolved])

  // Drive currentTime from video
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const handler = () => {
      if (!seekingRef.current) {
        onTimeUpdate(video.currentTime)
      }
    }
    video.addEventListener('timeupdate', handler)
    return () => video.removeEventListener('timeupdate', handler)
  }, [videoRef, onTimeUpdate])

  // Sync play/pause
  useEffect(() => {
    const play = async (el: HTMLMediaElement | null) => {
      if (!el) return
      try { await el.play() } catch { /* autoplay may be blocked */ }
    }

    if (isPlaying) {
      play(videoRef.current)
      play(userAudioRef.current)
      play(aiAudioRef.current)
    } else {
      videoRef.current?.pause()
      userAudioRef.current?.pause()
      aiAudioRef.current?.pause()
    }
  }, [isPlaying, videoRef])

  // Sync volume
  useEffect(() => {
    const vol = isMuted ? 0 : volume
    if (userAudioRef.current) userAudioRef.current.volume = vol
    if (aiAudioRef.current) aiAudioRef.current.volume = vol
    if (videoRef.current) videoRef.current.volume = 0 // video track has no separate audio
  }, [volume, isMuted, videoRef])

  // Seek all tracks
  const seekTo = useCallback((time: number) => {
    seekingRef.current = true
    if (videoRef.current) videoRef.current.currentTime = time
    if (userAudioRef.current) userAudioRef.current.currentTime = time
    if (aiAudioRef.current) aiAudioRef.current.currentTime = time
    onTimeUpdate(time)
    setTimeout(() => { seekingRef.current = false }, 100)
  }, [videoRef, onTimeUpdate])

  // Handle ended
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const handler = () => onPlayPause()
    video.addEventListener('ended', handler)
    return () => video.removeEventListener('ended', handler)
  }, [videoRef, onPlayPause])

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

      {/* Track switcher (camera / screen) */}
      {hasScreenRecording && (
        <div className="flex items-center gap-1 border-l border-[var(--border-color)] pl-3">
          <button
            onClick={() => onTrackSwitch('camera')}
            className={`p-1.5 rounded transition-colors ${
              activeTrack === 'camera'
                ? 'text-[var(--accent-color)] bg-[var(--accent-light)]'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
            }`}
            title="Camera view"
          >
            <VideoCameraIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => onTrackSwitch('screen')}
            className={`p-1.5 rounded transition-colors ${
              activeTrack === 'screen'
                ? 'text-[var(--accent-color)] bg-[var(--accent-light)]'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
            }`}
            title="Screen recording"
          >
            <ComputerDesktopIcon className="w-4 h-4" />
          </button>
        </div>
      )}

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

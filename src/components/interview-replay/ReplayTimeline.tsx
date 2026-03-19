'use client'

import { useRef, useCallback } from 'react'
import type { Exchange } from '@/types/interviewSession'
import type { MomentAnnotation } from '@/types/interviewAnalysis'

interface ReplayTimelineProps {
  exchanges: Exchange[]
  moments: MomentAnnotation[]
  currentTime: number
  totalDuration: number
  onSeek: (time: number) => void
}

function scoreColor(score: number): string {
  if (score >= 7) return 'var(--success)'
  if (score >= 5) return 'var(--warning)'
  return 'var(--error)'
}

/**
 * Compute the relative time (seconds from round start) for an exchange.
 * Falls back to even distribution if timestamps are missing.
 */
function getRelativeTime(exchange: Exchange, firstTimestamp: string | null, index: number, total: number, duration: number): number {
  if (firstTimestamp && exchange.timestamp) {
    const offset = (new Date(exchange.timestamp).getTime() - new Date(firstTimestamp).getTime()) / 1000
    if (isFinite(offset) && offset >= 0) return offset
  }
  // Fallback: distribute evenly across duration
  return total > 1 ? (index / (total - 1)) * duration : 0
}

export function ReplayTimeline({ exchanges, moments, currentTime, totalDuration, onSeek }: ReplayTimelineProps) {
  const barRef = useRef<HTMLDivElement>(null)

  const firstTimestamp = exchanges.length > 0 ? exchanges[0].timestamp : null
  const duration = totalDuration || 1

  const handlePointerSeek = useCallback((clientX: number) => {
    const bar = barRef.current
    if (!bar) return
    const rect = bar.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    onSeek(pct * duration)
  }, [duration, onSeek])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    handlePointerSeek(e.clientX)

    const onMove = (ev: MouseEvent) => handlePointerSeek(ev.clientX)
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [handlePointerSeek])

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0

  // Compute moment positions for markers
  const keyMoments = moments.filter((m) => m.isKeyMoment)

  return (
    <div className="relative select-none">
      {/* Clickable bar area */}
      <div
        ref={barRef}
        onMouseDown={handleMouseDown}
        className="relative h-10 flex items-center cursor-pointer group"
      >
        {/* Track background */}
        <div className="absolute left-0 right-0 h-1.5 rounded-full bg-[var(--bg-muted)]">
          {/* Progress fill */}
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-[var(--accent-color)] transition-[width] duration-100"
            style={{ width: `${Math.min(100, progressPct)}%` }}
          />
        </div>

        {/* Exchange tick marks */}
        {exchanges.map((ex, i) => {
          const t = getRelativeTime(ex, firstTimestamp, i, exchanges.length, duration)
          const pct = (t / duration) * 100
          return (
            <div
              key={i}
              className="absolute top-1/2 -translate-y-1/2 w-px h-2.5 bg-[var(--text-tertiary)]/30"
              style={{ left: `${pct}%` }}
            />
          )
        })}

        {/* Key moment markers (diamonds) */}
        {keyMoments.map((m, i) => {
          // Position at the midpoint of the moment's exchange range
          const midIdx = Math.floor((m.exchangeStartIndex + m.exchangeEndIndex) / 2)
          const ex = exchanges[midIdx] || exchanges[m.exchangeStartIndex]
          if (!ex) return null
          const t = getRelativeTime(ex, firstTimestamp, midIdx, exchanges.length, duration)
          const pct = (t / duration) * 100

          return (
            <div
              key={`moment-${i}`}
              className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rotate-45 rounded-sm cursor-pointer z-10"
              style={{
                left: `${pct}%`,
                backgroundColor: scoreColor(m.qualityScore),
                marginLeft: '-5px',
              }}
              title={m.annotation}
              onClick={(e) => {
                e.stopPropagation()
                onSeek(t)
              }}
            />
          )
        })}

        {/* Scrubber head */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[var(--accent-color)] shadow-md border-2 border-white z-20 pointer-events-none transition-[left] duration-100"
          style={{ left: `calc(${Math.min(100, progressPct)}% - 8px)` }}
        />
      </div>

      {/* Duration labels */}
      <div className="flex justify-between mt-0.5">
        <span className="text-[10px] font-mono text-[var(--text-tertiary)]">0:00</span>
        <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
          {Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}
        </span>
      </div>
    </div>
  )
}

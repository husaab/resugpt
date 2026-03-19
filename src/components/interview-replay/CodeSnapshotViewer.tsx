'use client'

import { useMemo } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, CodeBracketIcon } from '@heroicons/react/24/outline'
import type { CodeSnapshot } from '@/types/interviewAnalysis'

interface CodeSnapshotViewerProps {
  snapshots: CodeSnapshot[]
  currentTime: number
  language: string
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function CodeSnapshotViewer({ snapshots, currentTime, language }: CodeSnapshotViewerProps) {
  // Find the active snapshot (most recent at or before currentTime)
  const activeIndex = useMemo(() => {
    if (snapshots.length === 0) return -1
    let best = 0
    for (let i = 1; i < snapshots.length; i++) {
      const relSec = snapshots[i].relativeSeconds ?? (i * 6) // fallback: ~6s per snapshot
      if (relSec <= currentTime) best = i
    }
    return best
  }, [snapshots, currentTime])

  if (snapshots.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8 py-12">
        <div className="w-16 h-16 rounded-2xl bg-[var(--bg-muted)] flex items-center justify-center mb-4">
          <CodeBracketIcon className="w-8 h-8 text-[var(--text-tertiary)]" />
        </div>
        <p className="text-sm text-[var(--text-tertiary)]">
          No code snapshots captured for this round.
        </p>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">
          Code snapshots are captured for coding rounds in future sessions.
        </p>
      </div>
    )
  }

  const activeSnapshot = snapshots[activeIndex] || snapshots[0]
  const capturedRelSec = activeSnapshot.relativeSeconds ?? (activeIndex * 6)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header with navigation */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border-color)] bg-[var(--bg-elevated)]">
        <div className="flex items-center gap-2">
          <CodeBracketIcon className="w-4 h-4 text-[var(--text-tertiary)]" />
          <span className="text-xs font-medium text-[var(--text-secondary)]">
            Snapshot {activeIndex + 1} of {snapshots.length}
          </span>
          <span className="text-xs text-[var(--text-tertiary)]">
            — {formatTime(capturedRelSec)}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            disabled={activeIndex <= 0}
            className="p-1 rounded hover:bg-[var(--bg-muted)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeftIcon className="w-4 h-4 text-[var(--text-tertiary)]" />
          </button>
          <button
            disabled={activeIndex >= snapshots.length - 1}
            className="p-1 rounded hover:bg-[var(--bg-muted)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRightIcon className="w-4 h-4 text-[var(--text-tertiary)]" />
          </button>
        </div>
      </div>

      {/* Code display */}
      <div className="flex-1 overflow-auto bg-[var(--bg-body)]">
        <pre className="p-4 text-sm font-mono leading-relaxed text-[var(--text-primary)] whitespace-pre-wrap break-words">
          <code>{activeSnapshot.code}</code>
        </pre>
      </div>

      {/* Language tag */}
      <div className="px-4 py-1.5 border-t border-[var(--border-color)] bg-[var(--bg-elevated)]">
        <span className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase">
          {activeSnapshot.language || language}
        </span>
      </div>
    </div>
  )
}

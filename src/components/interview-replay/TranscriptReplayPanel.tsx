'use client'

import { useEffect, useRef, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { StarIcon, LightBulbIcon } from '@heroicons/react/24/solid'
import type { Exchange } from '@/types/interviewSession'
import type { MomentAnnotation } from '@/types/interviewAnalysis'

interface TranscriptReplayPanelProps {
  exchanges: Exchange[]
  moments: MomentAnnotation[]
  currentTime: number
  roundStartTimestamp: string | null
  isAudioMode: boolean
}

const SKILL_BADGE_VARIANT: Record<string, 'primary' | 'success' | 'warning' | 'error' | 'default'> = {
  communication: 'primary',
  problem_solving: 'warning',
  technical_depth: 'success',
  behavioral_examples: 'default',
  code_quality: 'error',
}

function scoreColor(score: number): string {
  if (score >= 7) return 'var(--success)'
  if (score >= 5) return 'var(--warning)'
  return 'var(--error)'
}

function formatSkillCategory(category: string): string {
  return category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function getRelativeSeconds(exchange: Exchange, firstTimestamp: string | null): number {
  if (!firstTimestamp || !exchange.timestamp) return 0
  const offset = (new Date(exchange.timestamp).getTime() - new Date(firstTimestamp).getTime()) / 1000
  return isFinite(offset) && offset >= 0 ? offset : 0
}

export function TranscriptReplayPanel({
  exchanges,
  moments,
  currentTime,
  roundStartTimestamp,
  isAudioMode,
}: TranscriptReplayPanelProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const exchangeRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  // Find the active exchange index based on currentTime
  const activeExchangeIndex = useMemo(() => {
    if (exchanges.length === 0) return -1

    for (let i = exchanges.length - 1; i >= 0; i--) {
      const relSec = getRelativeSeconds(exchanges[i], roundStartTimestamp)
      if (relSec <= currentTime) return i
    }
    return 0
  }, [exchanges, currentTime, roundStartTimestamp])

  // Build a map: exchangeEndIndex → MomentAnnotation[]
  const momentsByExchangeEnd = useMemo(() => {
    const map = new Map<number, MomentAnnotation[]>()
    for (const m of moments) {
      const key = m.exchangeEndIndex
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(m)
    }
    return map
  }, [moments])

  // In text mode, determine which exchanges should be visible
  const visibleCount = useMemo(() => {
    if (isAudioMode) return exchanges.length
    return activeExchangeIndex + 1
  }, [isAudioMode, activeExchangeIndex, exchanges.length])

  // Auto-scroll to active exchange
  useEffect(() => {
    if (activeExchangeIndex < 0) return
    const el = exchangeRefs.current.get(activeExchangeIndex)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [activeExchangeIndex])

  return (
    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-6">
      <div className="max-w-2xl mx-auto space-y-4">
        {exchanges.length === 0 && (
          <p className="text-center text-sm text-[var(--text-tertiary)] py-12">
            No transcript available for this round.
          </p>
        )}

        {exchanges.slice(0, visibleCount).map((ex, i) => {
          const isActive = i === activeExchangeIndex
          const momentsForExchange = momentsByExchangeEnd.get(i) || []

          return (
            <div key={i}>
              {/* Exchange bubble */}
              <div
                ref={(el) => {
                  if (el) exchangeRefs.current.set(i, el)
                }}
                className={`flex ${ex.role === 'candidate' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 transition-all duration-200 ${
                    ex.role === 'candidate'
                      ? 'bg-[var(--accent-color)] text-white rounded-br-md'
                      : 'bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-bl-md'
                  } ${
                    isActive
                      ? 'ring-2 ring-[var(--accent-color)]/40 shadow-md'
                      : ''
                  }`}
                >
                  <p className={`text-xs font-medium mb-1 ${
                    ex.role === 'candidate' ? 'text-white/70' : 'text-[var(--accent-color)]'
                  }`}>
                    {ex.role === 'candidate' ? 'You' : 'Interviewer'}
                  </p>
                  <p className="text-sm leading-relaxed">{ex.content}</p>
                </div>
              </div>

              {/* Moment annotations (appear after candidate bubbles) */}
              {momentsForExchange.length > 0 && (
                <div className="mt-2 space-y-2 ml-4 mr-4">
                  {momentsForExchange.map((m, mi) => (
                    <div
                      key={mi}
                      className={`rounded-lg p-3 border ${
                        m.isKeyMoment
                          ? 'bg-[var(--warning-light)] border-[var(--warning)]/20'
                          : 'bg-[var(--bg-muted)] border-[var(--border-color)]'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {m.isKeyMoment && (
                          <StarIcon className="w-3.5 h-3.5 text-[var(--warning)] shrink-0" />
                        )}
                        <Badge
                          variant={SKILL_BADGE_VARIANT[m.skillCategory] || 'default'}
                          size="sm"
                        >
                          {formatSkillCategory(m.skillCategory)}
                        </Badge>
                        <span
                          className="text-xs font-semibold"
                          style={{ color: scoreColor(m.qualityScore) }}
                        >
                          {m.qualityScore}/10
                        </span>
                      </div>

                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        {m.annotation}
                      </p>

                      {m.improvementTip && (
                        <div className="mt-1.5 flex items-start gap-1.5">
                          <LightBulbIcon className="w-3.5 h-3.5 text-[var(--warning)] shrink-0 mt-0.5" />
                          <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic">
                            {m.improvementTip}
                          </p>
                        </div>
                      )}

                      {m.isKeyMoment && m.keyMomentReason && (
                        <p className="mt-1 text-[10px] text-[var(--text-tertiary)] uppercase tracking-wide">
                          {m.keyMomentReason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

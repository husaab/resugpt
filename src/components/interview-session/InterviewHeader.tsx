'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ROUND_TYPE_VARIANT } from '@/components/interview-prep/RoleDetailsContent'
import { ConnectionStatus } from './ConnectionStatus'
import {
  MicrophoneIcon,
  StopIcon,
} from '@heroicons/react/24/outline'
import type { RealtimeConnectionState } from '@/types/interviewRealtime'

interface InterviewHeaderProps {
  companyName: string
  companyLogo: string | null
  roleTitle: string
  roundNumber: number
  totalRounds: number
  roundType: string
  roundTitle: string
  elapsedSeconds: number
  isMuted: boolean
  connectionState: RealtimeConnectionState
  isEndingRound: boolean
  onToggleMute: () => void
  onEndRound: () => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function InterviewHeader({
  companyName,
  companyLogo,
  roleTitle,
  roundNumber,
  totalRounds,
  roundType,
  roundTitle,
  elapsedSeconds,
  isMuted,
  connectionState,
  isEndingRound,
  onToggleMute,
  onEndRound,
}: InterviewHeaderProps) {
  const variant = ROUND_TYPE_VARIANT[roundType as keyof typeof ROUND_TYPE_VARIANT] ?? 'default'

  return (
    <div className="bg-[var(--bg-elevated)] border-b border-[var(--border-color)] px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Company + round info */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Company logo */}
          <div className="w-8 h-8 rounded-lg bg-[var(--bg-muted)] border border-[var(--border-color)] flex items-center justify-center overflow-hidden flex-shrink-0">
            {companyLogo ? (
              <img src={companyLogo} alt={companyName} className="w-full h-full object-contain p-0.5" />
            ) : (
              <span className="text-xs font-bold" style={{ color: 'var(--accent-color)' }}>
                {companyName.charAt(0)}
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
                {roleTitle}
              </span>
              <Badge variant={variant} size="sm">
                {roundType.replace(/_/g, ' ')}
              </Badge>
            </div>
            <p className="text-xs text-[var(--text-tertiary)]">
              Round {roundNumber} of {totalRounds}: {roundTitle}
            </p>
          </div>
        </div>

        {/* Center: Timer + connection */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="font-mono text-lg font-semibold text-[var(--text-primary)]">
            {formatTime(elapsedSeconds)}
          </span>
          <ConnectionStatus state={connectionState} />
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onToggleMute}
            className={`relative p-2 rounded-lg transition-colors ${
              isMuted
                ? 'bg-[var(--error-light)] text-[var(--error)]'
                : 'bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            <MicrophoneIcon className="w-5 h-5" />
            {isMuted && (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="block w-6 h-0.5 bg-[var(--error)] rotate-45 rounded" />
              </span>
            )}
          </button>

          <Button
            variant="destructive"
            size="sm"
            onClick={onEndRound}
            isLoading={isEndingRound}
            disabled={connectionState !== 'connected' && !isEndingRound}
          >
            <StopIcon className="w-4 h-4" />
            End Round
          </Button>
        </div>
      </div>
    </div>
  )
}

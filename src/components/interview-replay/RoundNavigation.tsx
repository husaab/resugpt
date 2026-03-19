import { Badge } from '@/components/ui/badge'
import { ROUND_TYPE_VARIANT } from '@/components/interview-prep/RoleDetailsContent'
import { SpeakerWaveIcon } from '@heroicons/react/24/outline'
import type { SessionRound } from '@/types/interviewSession'
import type { RoundAudioUrls } from '@/types/interviewAnalysis'

interface RoundNavigationProps {
  rounds: SessionRound[]
  activeRound: number
  onRoundChange: (roundNumber: number) => void
  roundAudio: RoundAudioUrls[]
}

function scoreColor(score: number): string {
  if (score >= 7) return 'var(--success)'
  if (score >= 5) return 'var(--warning)'
  return 'var(--error)'
}

export function RoundNavigation({ rounds, activeRound, onRoundChange, roundAudio }: RoundNavigationProps) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {rounds.map((round) => {
        const isActive = round.roundNumber === activeRound
        const typeVariant = ROUND_TYPE_VARIANT[round.type as keyof typeof ROUND_TYPE_VARIANT] ?? 'default'
        const hasAudio = roundAudio.some(
          (a) => a.roundNumber === round.roundNumber && (a.userAudioUrl || a.aiAudioUrl)
        )

        return (
          <button
            key={round.roundNumber}
            onClick={() => onRoundChange(round.roundNumber)}
            className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-left transition-colors shrink-0 ${
              isActive
                ? 'bg-[var(--bg-elevated)] border border-[var(--accent-color)]/30'
                : 'hover:bg-[var(--bg-muted)]'
            }`}
          >
            <span className="text-xs font-mono text-[var(--text-tertiary)]">
              R{round.roundNumber}
            </span>

            <Badge variant={typeVariant} size="sm">
              {round.type.replace(/_/g, ' ')}
            </Badge>

            {round.score != null && (
              <span
                className="text-xs font-semibold"
                style={{ color: scoreColor(round.score) }}
              >
                {round.score}
              </span>
            )}

            {hasAudio && (
              <SpeakerWaveIcon className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            )}

            {/* Active underline */}
            {isActive && (
              <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[var(--accent-color)] rounded-full" />
            )}
          </button>
        )
      })}
    </div>
  )
}

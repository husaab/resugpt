'use client'

import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ROUND_TYPE_VARIANT } from '@/components/interview-prep/RoleDetailsContent'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'

interface RoundScoreCardProps {
  roundTitle: string
  roundType: string
  roundNumber: number
  score: number
  strengths: string[]
  weaknesses: string[]
  feedback: string
  hasNextRound: boolean
  testResults?: { passed: number; total: number } | null
  onNextRound?: () => void
  onViewResults?: () => void
}

function scoreColor(score: number): string {
  if (score >= 7) return 'var(--success)'
  if (score >= 5) return 'var(--warning)'
  return 'var(--error)'
}

export function RoundScoreCard({
  roundTitle,
  roundType,
  roundNumber,
  score,
  strengths,
  weaknesses,
  feedback,
  hasNextRound,
  testResults,
  onNextRound,
  onViewResults,
}: RoundScoreCardProps) {
  const variant = ROUND_TYPE_VARIANT[roundType as keyof typeof ROUND_TYPE_VARIANT] ?? 'default'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-xl mx-auto"
    >
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-2xl p-6">
        {/* Round header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs text-[var(--text-tertiary)] mb-1">Round {roundNumber}</p>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">{roundTitle}</h3>
          </div>
          <Badge variant={variant} size="sm">
            {roundType.replace(/_/g, ' ')}
          </Badge>
        </div>

        {/* Score circle */}
        <div className="flex justify-center mb-6">
          <div
            className="w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center"
            style={{ borderColor: scoreColor(score) }}
          >
            <span
              className="text-3xl font-bold"
              style={{ color: scoreColor(score) }}
            >
              {score}
            </span>
            <span className="text-xs text-[var(--text-tertiary)]">/10</span>
          </div>
        </div>

        {/* Test Results (for coding problems) */}
        {testResults && testResults.total > 0 && (
          <div className="mb-4 p-3 bg-[var(--bg-muted)] rounded-xl flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--text-secondary)]">Test Cases</span>
            <span
              className={`text-sm font-bold ${
                testResults.passed === testResults.total
                  ? 'text-emerald-400'
                  : testResults.passed > 0
                    ? 'text-amber-400'
                    : 'text-red-400'
              }`}
            >
              {testResults.passed}/{testResults.total} passed
            </span>
          </div>
        )}

        {/* Strengths */}
        {strengths.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-semibold text-[var(--success)] flex items-center gap-1.5 mb-2">
              <CheckCircleIcon className="w-4 h-4" />
              Strengths
            </p>
            <ul className="space-y-1">
              {strengths.map((s, i) => (
                <li key={i} className="text-sm text-[var(--text-secondary)] flex items-start gap-2">
                  <span className="text-[var(--success)] mt-0.5 flex-shrink-0">&bull;</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Weaknesses */}
        {weaknesses.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-semibold text-[var(--error)] flex items-center gap-1.5 mb-2">
              <ExclamationTriangleIcon className="w-4 h-4" />
              Areas for Improvement
            </p>
            <ul className="space-y-1">
              {weaknesses.map((w, i) => (
                <li key={i} className="text-sm text-[var(--text-secondary)] flex items-start gap-2">
                  <span className="text-[var(--error)] mt-0.5 flex-shrink-0">&bull;</span>
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Feedback */}
        {feedback && (
          <div className="mb-6 p-3 bg-[var(--bg-muted)] rounded-xl">
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{feedback}</p>
          </div>
        )}

        {/* Action */}
        {hasNextRound ? (
          <Button variant="primary" size="lg" onClick={onNextRound} className="w-full">
            <ArrowRightIcon className="w-5 h-5" />
            Next Round
          </Button>
        ) : (
          <Button variant="primary" size="lg" onClick={onViewResults} className="w-full">
            <ChartBarIcon className="w-5 h-5" />
            View Results
          </Button>
        )}
      </div>
    </motion.div>
  )
}

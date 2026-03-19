'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  BriefcaseIcon,
  PlayIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ROUND_TYPE_VARIANT } from '@/components/interview-prep/RoleDetailsContent'
import { AnalysisPendingBanner } from '@/components/interview-replay/AnalysisPendingBanner'
import { getInterviewSession, getAnalysis } from '@/services/interviewSessionService'
import type { InterviewSession } from '@/types/interviewSession'
import type { InterviewAnalysis } from '@/types/interviewAnalysis'

const RECOMMENDATION_CONFIG: Record<string, { label: string; variant: 'success' | 'primary' | 'warning' | 'error' }> = {
  strong_hire: { label: 'Strong Hire', variant: 'success' },
  hire: { label: 'Hire', variant: 'primary' },
  lean_no_hire: { label: 'Lean No Hire', variant: 'warning' },
  no_hire: { label: 'No Hire', variant: 'error' },
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

export default function ResultsPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const router = useRouter()
  const { data: authSession, status } = useSession()

  const [session, setSession] = useState<InterviewSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set())
  const [expandedTranscripts, setExpandedTranscripts] = useState<Set<number>>(new Set())

  // Analysis state
  const [analysis, setAnalysis] = useState<InterviewAnalysis | null>(null)
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const googleId = authSession?.user?.googleId

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/interview-prep')
    }
  }, [status, router])

  useEffect(() => {
    if (!googleId || !sessionId) return
    let cancelled = false

    const load = async () => {
      try {
        setIsLoading(true)
        const res = await getInterviewSession(sessionId, googleId)
        if (cancelled) return

        if (!res.success) {
          setError('Failed to load session')
          return
        }

        if (res.data.status !== 'completed') {
          router.push(`/interview-prep/session/${sessionId}`)
          return
        }

        setSession(res.data)
      } catch (err: unknown) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load results')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [googleId, sessionId, router])

  // Fetch analysis after session loads
  useEffect(() => {
    if (!session || !googleId || !sessionId) return

    getAnalysis(sessionId, googleId)
      .then((res) => {
        if (res.success) setAnalysis(res.data)
      })
      .catch(() => {})
  }, [session, googleId, sessionId])

  // Poll while analysis is pending/processing
  useEffect(() => {
    if (!analysis || analysis.status === 'completed' || analysis.status === 'failed') {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
      return
    }

    if (!googleId || !sessionId) return

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await getAnalysis(sessionId, googleId)
        if (res.success) setAnalysis(res.data)
      } catch {
        // ignore polling errors
      }
    }, 5000)

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }
  }, [analysis?.status, googleId, sessionId])

  const toggleRound = (n: number) => {
    setExpandedRounds((prev) => {
      const next = new Set(prev)
      next.has(n) ? next.delete(n) : next.add(n)
      return next
    })
  }

  const toggleTranscript = (n: number) => {
    setExpandedTranscripts((prev) => {
      const next = new Set(prev)
      next.has(n) ? next.delete(n) : next.add(n)
      return next
    })
  }

  // Loading
  if (status === 'loading' || isLoading) {
    return (
      <div className="pt-24 pb-12 px-4">
        <div className="max-w-3xl mx-auto animate-pulse">
          <div className="h-5 w-40 bg-[var(--bg-muted)] rounded mb-8" />
          <div className="h-32 bg-[var(--bg-muted)] rounded-2xl mb-6" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-[var(--bg-muted)] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Error / not found
  if (error || !session) {
    return (
      <div className="pt-24 pb-12 px-4">
        <div className="max-w-3xl mx-auto text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--bg-muted)] flex items-center justify-center">
            <BriefcaseIcon className="w-8 h-8 text-[var(--text-tertiary)]" />
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Results not found</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6">{error || 'This session does not exist.'}</p>
          <Link href="/interview-prep/history">
            <Button variant="primary">Back to History</Button>
          </Link>
        </div>
      </div>
    )
  }

  const recConfig = RECOMMENDATION_CONFIG[session.recommendation || ''] || RECOMMENDATION_CONFIG.no_hire

  return (
    <div className="pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Back link */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          <Link
            href="/interview-prep/history"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-tertiary)] hover:text-[var(--accent-color)] transition-colors mb-8"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to History
          </Link>
        </motion.div>

        {/* Overall Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[var(--bg-muted)] border border-[var(--border-color)] flex items-center justify-center overflow-hidden">
              {session.company.logo ? (
                <img src={session.company.logo} alt={session.company.name} className="w-full h-full object-contain p-0.5" />
              ) : (
                <span className="text-sm font-bold" style={{ color: 'var(--accent-color)' }}>
                  {session.company.name.charAt(0)}
                </span>
              )}
            </div>
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">{session.company.name}</p>
              <h1 className="text-xl font-bold text-[var(--text-primary)]">{session.role.title}</h1>
            </div>
          </div>

          <div className="flex items-center justify-center gap-8 py-4">
            {/* Score */}
            <div className="text-center">
              <div
                className="w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center mx-auto"
                style={{ borderColor: session.overallScore != null ? scoreColor(session.overallScore) : 'var(--border-color)' }}
              >
                <span
                  className="text-4xl font-bold"
                  style={{ color: session.overallScore != null ? scoreColor(session.overallScore) : 'var(--text-tertiary)' }}
                >
                  {session.overallScore ?? '—'}
                </span>
                <span className="text-xs text-[var(--text-tertiary)]">/10</span>
              </div>
              <p className="text-xs text-[var(--text-tertiary)] mt-2">Overall Score</p>
            </div>

            {/* Recommendation */}
            <div className="text-center">
              <Badge variant={recConfig.variant} size="lg">
                {recConfig.label}
              </Badge>
              <p className="text-xs text-[var(--text-tertiary)] mt-2">Recommendation</p>
            </div>
          </div>

          {session.feedback && (
            <p className="text-sm text-[var(--text-secondary)] mt-4 p-3 bg-[var(--bg-muted)] rounded-xl leading-relaxed">
              {session.feedback}
            </p>
          )}
        </motion.div>

        {/* AI Analysis Preview */}
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            {analysis.status === 'completed' && analysis.topImprovements.length > 0 ? (
              <div className="bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <LightBulbIcon className="w-5 h-5 text-[var(--warning)]" />
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                    Top Improvement Moments
                  </h3>
                </div>
                <div className="space-y-2.5">
                  {analysis.topImprovements.map((tip, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 rounded-lg bg-[var(--warning-light)] border border-[var(--warning)]/15"
                    >
                      <Badge
                        variant={SKILL_BADGE_VARIANT[tip.skillCategory] || 'default'}
                        size="sm"
                        className="shrink-0 mt-0.5"
                      >
                        {formatSkillCategory(tip.skillCategory)}
                      </Badge>
                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                        {tip.tip}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <AnalysisPendingBanner status={analysis.status} />
            )}
          </motion.div>
        )}

        {/* Per-round results */}
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Round Results</h2>

        <div className="space-y-3 mb-8">
          {session.rounds.map((round, index) => {
            const isExpanded = expandedRounds.has(round.roundNumber)
            const isTranscriptExpanded = expandedTranscripts.has(round.roundNumber)
            const typeVariant = ROUND_TYPE_VARIANT[round.type as keyof typeof ROUND_TYPE_VARIANT] ?? 'default'

            return (
              <motion.div
                key={round.roundNumber}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl overflow-hidden"
              >
                {/* Round header (clickable) */}
                <button
                  onClick={() => toggleRound(round.roundNumber)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-[var(--bg-muted)] transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-[var(--text-tertiary)]">
                      Round {round.roundNumber}
                    </span>
                    <Badge variant={typeVariant} size="sm">
                      {round.type.replace(/_/g, ' ')}
                    </Badge>
                    {round.score != null && (
                      <span
                        className="text-sm font-semibold"
                        style={{ color: scoreColor(round.score) }}
                      >
                        {round.score}/10
                      </span>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronUpIcon className="w-4 h-4 text-[var(--text-tertiary)]" />
                  ) : (
                    <ChevronDownIcon className="w-4 h-4 text-[var(--text-tertiary)]" />
                  )}
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-[var(--border-color)] pt-4">
                    {/* Strengths */}
                    {round.strengths.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-[var(--success)] flex items-center gap-1.5 mb-1.5">
                          <CheckCircleIcon className="w-4 h-4" />
                          Strengths
                        </p>
                        <ul className="space-y-1">
                          {round.strengths.map((s, i) => (
                            <li key={i} className="text-sm text-[var(--text-secondary)] flex items-start gap-2">
                              <span className="text-[var(--success)] mt-0.5">&bull;</span>
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Weaknesses */}
                    {round.weaknesses.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-[var(--error)] flex items-center gap-1.5 mb-1.5">
                          <ExclamationTriangleIcon className="w-4 h-4" />
                          Areas for Improvement
                        </p>
                        <ul className="space-y-1">
                          {round.weaknesses.map((w, i) => (
                            <li key={i} className="text-sm text-[var(--text-secondary)] flex items-start gap-2">
                              <span className="text-[var(--error)] mt-0.5">&bull;</span>
                              {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Feedback */}
                    {round.feedback && (
                      <p className="text-sm text-[var(--text-secondary)] p-3 bg-[var(--bg-muted)] rounded-lg leading-relaxed mb-3">
                        {round.feedback}
                      </p>
                    )}

                    {/* Transcript toggle */}
                    {round.exchanges.length > 0 && (
                      <div>
                        <button
                          onClick={() => toggleTranscript(round.roundNumber)}
                          className="text-sm text-[var(--accent-color)] hover:underline flex items-center gap-1"
                        >
                          {isTranscriptExpanded ? 'Hide' : 'Show'} transcript ({round.exchanges.length} messages)
                          {isTranscriptExpanded ? (
                            <ChevronUpIcon className="w-3 h-3" />
                          ) : (
                            <ChevronDownIcon className="w-3 h-3" />
                          )}
                        </button>

                        {isTranscriptExpanded && (
                          <div className="mt-3 space-y-2 max-h-80 overflow-y-auto">
                            {round.exchanges.map((ex, i) => (
                              <div
                                key={i}
                                className={`text-sm p-2 rounded-lg ${
                                  ex.role === 'candidate'
                                    ? 'bg-[var(--accent-light)] ml-8'
                                    : 'bg-[var(--bg-muted)] mr-8'
                                }`}
                              >
                                <span className={`text-xs font-medium ${
                                  ex.role === 'candidate' ? 'text-[var(--accent-color)]' : 'text-[var(--text-tertiary)]'
                                }`}>
                                  {ex.role === 'candidate' ? 'You' : 'Interviewer'}
                                </span>
                                <p className="text-[var(--text-secondary)] mt-0.5">{ex.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Link href={`/interview-prep/session/${sessionId}/replay`}>
            <Button variant="primary" size="md">
              <PlayIcon className="w-4 h-4" />
              View Replay & Analysis
            </Button>
          </Link>
          <Link href={`/interview-prep/${session.company.id}/roles/${session.role.id}/briefing`}>
            <Button variant="outline" size="md">
              Practice Again
            </Button>
          </Link>
          <Link href="/interview-prep/history">
            <Button variant="ghost" size="md">
              Back to History
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

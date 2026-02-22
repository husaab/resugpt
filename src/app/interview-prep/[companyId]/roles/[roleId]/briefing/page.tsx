'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  PlayIcon,
  ClockIcon,
  BriefcaseIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LEVEL_VARIANT, ROUND_TYPE_VARIANT } from '@/components/interview-prep/RoleDetailsContent'
import { getRoleDetails } from '@/services/interviewPrepService'
import { createInterviewSession, listInterviewSessions, abandonInterviewSession } from '@/services/interviewSessionService'
import { useCredits } from '@/contexts/CreditContext'
import type { RoleDetails } from '@/types/interviewPrep'
import type { InterviewSessionListItem } from '@/types/interviewSession'

const SESSION_CREDIT_COST = 2

export default function BriefingPage() {
  const { companyId, roleId } = useParams<{ companyId: string; roleId: string }>()
  const router = useRouter()
  const { data: session, status } = useSession()
  const { displayCredits, subscriptionStatus, setOptimisticCredits, refreshCredits } = useCredits()

  const [details, setDetails] = useState<RoleDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [isStarting, setIsStarting] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)
  const [logoFailed, setLogoFailed] = useState(false)

  // Active session detection
  const [activeSession, setActiveSession] = useState<InterviewSessionListItem | null>(null)
  const [isCheckingSessions, setIsCheckingSessions] = useState(true)
  const [showAbandonModal, setShowAbandonModal] = useState(false)
  const [isAbandoning, setIsAbandoning] = useState(false)

  // Redirect unauthenticated users back to role page
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/interview-prep/${companyId}/roles/${roleId}`)
    }
  }, [status, companyId, roleId, router])

  // Fetch role details
  useEffect(() => {
    if (!roleId) return
    let cancelled = false

    const fetchDetails = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const res = await getRoleDetails(roleId)
        if (cancelled) return
        if (res.success) {
          setDetails(res.data)
        } else {
          setError('Failed to load role details')
        }
      } catch (err: unknown) {
        if (cancelled) return
        const message = err instanceof Error ? err.message : 'Failed to load role details'
        setError(message)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchDetails()
    return () => { cancelled = true }
  }, [roleId, retryCount])

  // Check for existing in-progress session for this role
  useEffect(() => {
    if (!session?.user?.googleId || !roleId) {
      setIsCheckingSessions(false)
      return
    }
    let cancelled = false

    const checkExistingSessions = async () => {
      try {
        setIsCheckingSessions(true)
        const res = await listInterviewSessions(session.user.googleId)
        if (cancelled) return
        if (res.success) {
          const existing = res.data.find(
            (s) => s.role.id === roleId && s.status === 'in_progress'
          )
          setActiveSession(existing ?? null)
        }
      } catch {
        // Non-critical — if check fails, allow starting a new session
        if (!cancelled) setActiveSession(null)
      } finally {
        if (!cancelled) setIsCheckingSessions(false)
      }
    }

    checkExistingSessions()
    return () => { cancelled = true }
  }, [session?.user?.googleId, roleId])

  const canAfford =
    subscriptionStatus === 'premium' || displayCredits >= SESSION_CREDIT_COST

  const handleStartInterview = async () => {
    if (!session?.user?.googleId) return
    if (!canAfford) return

    try {
      setIsStarting(true)
      setStartError(null)

      // Optimistic credit decrement (2 credits)
      if (subscriptionStatus !== 'premium') {
        setOptimisticCredits(Math.max(0, displayCredits - SESSION_CREDIT_COST))
      }

      const res = await createInterviewSession({
        googleId: session.user.googleId,
        roleId,
      })

      // Sync real credit value from server
      await refreshCredits()

      if (res.success) {
        router.push(`/interview-prep/session/${res.data.id}`)
      }
    } catch (err: unknown) {
      // Revert optimistic update on failure
      await refreshCredits()
      const message = err instanceof Error ? err.message : 'Failed to start interview'
      setStartError(message)
    } finally {
      setIsStarting(false)
    }
  }

  const handleAbandonSession = async () => {
    if (!activeSession || !session?.user?.googleId) return

    try {
      setIsAbandoning(true)
      await abandonInterviewSession(activeSession.id, session.user.googleId)
      setActiveSession(null)
      setShowAbandonModal(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to abandon session'
      setStartError(message)
      setShowAbandonModal(false)
    } finally {
      setIsAbandoning(false)
    }
  }

  // ─── Loading State ──────────────────────────────────

  if (status === 'loading' || isLoading || isCheckingSessions) {
    return (
      <div className="pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-5 w-40 bg-[var(--bg-muted)] rounded mb-8" />
            <div className="bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-[var(--bg-muted)]" />
                <div className="space-y-2">
                  <div className="h-6 w-48 bg-[var(--bg-muted)] rounded" />
                  <div className="h-4 w-32 bg-[var(--bg-muted)] rounded" />
                </div>
              </div>
              <div className="h-4 w-full max-w-sm bg-[var(--bg-muted)] rounded" />
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-[var(--bg-muted)] rounded-xl" />
              ))}
            </div>
            <div className="space-y-3 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-[var(--bg-muted)] rounded-xl" />
              ))}
            </div>
            <div className="h-24 bg-[var(--bg-muted)] rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  // ─── Error / 404 State ──────────────────────────────

  if (error || !details) {
    return (
      <div className="pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--bg-muted)] flex items-center justify-center">
            <BriefcaseIcon className="w-10 h-10 text-[var(--text-tertiary)]" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            Role not found
          </h2>
          <p className="text-[var(--text-secondary)] mb-6">
            {error || 'This role does not exist or has been removed.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setRetryCount((c) => c + 1)}
              className="px-4 py-2 text-sm font-medium text-[var(--accent-color)] bg-[var(--accent-light)] rounded-lg hover:opacity-80 transition-opacity"
            >
              Try again
            </button>
            <Link href={`/interview-prep/${companyId}/roles/${roleId}`}>
              <Button variant="primary">Back to Role</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ─── Derived values ─────────────────────────────────

  const company = details.company
  const totalQuestions = details.rounds.reduce((sum, r) => sum + r.questions.length, 0)
  const totalDuration = details.rounds.reduce((sum, r) => sum + r.duration, 0)

  // ─── Main Render ────────────────────────────────────

  return (
    <div className="pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Back link */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          <Link
            href={`/interview-prep/${companyId}/roles/${roleId}`}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-tertiary)] hover:text-[var(--accent-color)] transition-colors mb-8"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to {company.name} &mdash; {details.title}
          </Link>
        </motion.div>

        {/* Role Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-2xl p-6 mb-6"
        >
          <div className="flex items-start gap-4">
            {/* Company logo */}
            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-[var(--bg-muted)] border border-[var(--border-color)] flex items-center justify-center overflow-hidden">
              {company.logo && !logoFailed ? (
                <img
                  src={company.logo}
                  alt={company.name}
                  className="w-full h-full object-contain p-1.5"
                  onError={() => setLogoFailed(true)}
                />
              ) : (
                <span className="text-lg font-bold" style={{ color: 'var(--accent-color)' }}>
                  {company.name.charAt(0)}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm text-[var(--text-tertiary)] mb-0.5">{company.name}</p>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">{details.title}</h1>
              <div className="flex items-center gap-2 flex-wrap mt-1.5">
                <Badge variant={LEVEL_VARIANT[details.level]} size="sm">
                  {details.level}
                </Badge>
                {details.department && (
                  <span className="text-sm text-[var(--text-tertiary)]">{details.department}</span>
                )}
              </div>
            </div>
          </div>

          {details.description && (
            <p className="text-sm text-[var(--text-secondary)] mt-4">{details.description}</p>
          )}
        </motion.div>

        {/* Interview Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-3 gap-4 mb-6"
        >
          {[
            { label: 'Rounds', value: details.rounds.length },
            { label: 'Questions', value: totalQuestions },
            { label: 'Est. Duration', value: `${totalDuration} min` },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl p-4 text-center"
            >
              <p className="text-2xl font-bold text-[var(--text-primary)]">{stat.value}</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Round Breakdown */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
            Round Breakdown
          </h2>
          <div className="space-y-3">
            {details.rounds.map((round, index) => (
              <motion.div
                key={round.roundNumber}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.04 }}
                className="bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl px-5 py-4"
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-mono text-[var(--text-tertiary)] shrink-0">
                      Round {round.roundNumber}
                    </span>
                    <span className="font-medium text-sm text-[var(--text-primary)]">
                      {round.title}
                    </span>
                    <Badge variant={ROUND_TYPE_VARIANT[round.type]} size="sm">
                      {round.type.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)] shrink-0">
                    <span className="flex items-center gap-1">
                      <ClockIcon className="w-3.5 h-3.5" />
                      {round.duration} min
                    </span>
                    <span>{round.questions.length} question{round.questions.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                {round.description && (
                  <p className="text-xs text-[var(--text-secondary)] mt-2">{round.description}</p>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Tips */}
        {details.tips.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="bg-[var(--accent-light)] rounded-xl p-4 mb-6"
          >
            <div className="flex items-center gap-2 mb-2">
              <LightBulbIcon className="w-4 h-4 text-[var(--accent-color)]" />
              <p className="text-xs font-semibold text-[var(--accent-color)] uppercase tracking-wider">
                Tips
              </p>
            </div>
            <ul className="space-y-1">
              {details.tips.map((tip, i) => (
                <li key={i} className="text-sm text-[var(--text-secondary)] flex items-start gap-2">
                  <span className="text-[var(--accent-color)] mt-0.5 flex-shrink-0">&bull;</span>
                  {tip}
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* CTA Section — context-aware based on existing session */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-2xl p-6"
        >
          {activeSession ? (
            <>
              {/* Active session found */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <ClockIcon className="w-4 h-4 text-[var(--warning)]" />
                    <h3 className="font-semibold text-[var(--text-primary)]">Session in progress</h3>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">
                    You have an active interview session for this role, started{' '}
                    <span className="font-medium text-[var(--text-primary)]">
                      {new Date(activeSession.startedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    . Round {activeSession.currentRound} of {activeSession.roundCount}.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => setShowAbandonModal(true)}
                  >
                    <XMarkIcon className="w-4 h-4" />
                    Abandon
                  </Button>
                  <Link href={`/interview-prep/session/${activeSession.id}`}>
                    <Button variant="primary" size="md">
                      <ArrowRightIcon className="w-4 h-4" />
                      Resume
                    </Button>
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* No active session — start new */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)]">Ready to begin?</h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                    Starting a session costs{' '}
                    <span className="font-medium text-[var(--text-primary)]">
                      {SESSION_CREDIT_COST} credits
                    </span>
                    .
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleStartInterview}
                  disabled={!canAfford}
                  isLoading={isStarting}
                >
                  <PlayIcon className="w-5 h-5" />
                  Start Interview
                </Button>
              </div>

              {/* Insufficient credits warning */}
              {!canAfford && (
                <div className="mt-4 p-3 bg-[var(--warning-light)] rounded-lg flex items-start gap-2">
                  <ExclamationTriangleIcon className="w-4 h-4 text-[var(--warning)] mt-0.5 shrink-0" />
                  <p className="text-sm text-[var(--warning)]">
                    You have {displayCredits} credit{displayCredits !== 1 ? 's' : ''} remaining.
                    A session costs {SESSION_CREDIT_COST} credits.{' '}
                    <Link
                      href="/pricing"
                      className="font-medium underline underline-offset-2"
                    >
                      Upgrade your plan
                    </Link>
                    .
                  </p>
                </div>
              )}
            </>
          )}

          {/* Error (shared between start and abandon) */}
          {startError && (
            <div className="mt-4 flex items-start gap-2 text-sm text-[var(--error)]">
              <ExclamationTriangleIcon className="w-4 h-4 mt-0.5 shrink-0" />
              {startError}
            </div>
          )}
        </motion.div>
      </div>

      {/* Abandon Confirmation Modal */}
      {showAbandonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAbandonModal(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-2xl p-6 max-w-md w-full shadow-xl"
          >
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              Abandon Interview Session
            </h3>
            <p className="text-[var(--text-secondary)] mb-6">
              Are you sure you want to abandon your in-progress session? This will end the interview
              and you&apos;ll need to start a new one (which costs {SESSION_CREDIT_COST} credits).
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="ghost"
                onClick={() => setShowAbandonModal(false)}
                disabled={isAbandoning}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleAbandonSession}
                isLoading={isAbandoning}
                className="bg-[var(--error)] hover:bg-[var(--error)]"
              >
                Abandon Session
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

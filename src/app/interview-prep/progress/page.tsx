'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeftIcon,
  ChartBarIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getProgress } from '@/services/interviewSessionService'
import type { ProgressData, SkillCategory, SessionSkillPoint } from '@/types/interviewAnalysis'

// ─── Constants ──────────────────────────────────────────────

const SKILL_LABELS: Record<SkillCategory, string> = {
  communication: 'Communication',
  problem_solving: 'Problem Solving',
  technical_depth: 'Technical Depth',
  behavioral_examples: 'Behavioral Examples',
  code_quality: 'Code Quality',
}

const SKILL_COLORS: Record<SkillCategory, string> = {
  communication: 'var(--accent-color)',
  problem_solving: 'var(--warning)',
  technical_depth: 'var(--success)',
  behavioral_examples: '#8b5cf6', // purple
  code_quality: 'var(--error)',
}

function scoreColor(score: number): string {
  if (score >= 7) return 'var(--success)'
  if (score >= 5) return 'var(--warning)'
  return 'var(--error)'
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

// ─── SVG Score Trend Chart ──────────────────────────────────

function ScoreTrendChart({ sessions }: { sessions: SessionSkillPoint[] }) {
  if (sessions.length === 0) return null

  const W = 400
  const H = 140
  const PAD = { top: 15, right: 15, bottom: 25, left: 30 }
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom

  const points = sessions.map((s, i) => ({
    x: PAD.left + (sessions.length > 1 ? (i / (sessions.length - 1)) * plotW : plotW / 2),
    y: PAD.top + plotH - ((s.overallScore / 10) * plotH),
    score: s.overallScore,
    label: `${s.companyName} — ${s.roleTitle}`,
    date: s.completedAt,
  }))

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {/* Grid lines */}
      {[0, 5, 7, 10].map((val) => {
        const y = PAD.top + plotH - ((val / 10) * plotH)
        return (
          <g key={val}>
            <line
              x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
              stroke="var(--border-color)" strokeWidth={val === 5 || val === 7 ? 0.8 : 0.4}
              strokeDasharray={val === 5 || val === 7 ? '4,3' : undefined}
            />
            <text x={PAD.left - 5} y={y + 3} textAnchor="end" fontSize={9} fill="var(--text-tertiary)">
              {val}
            </text>
          </g>
        )
      })}

      {/* Line */}
      {sessions.length > 1 && (
        <polyline
          fill="none"
          stroke="var(--accent-color)"
          strokeWidth={2}
          strokeLinejoin="round"
          points={polyline}
        />
      )}

      {/* Points */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={5} fill={scoreColor(p.score)} stroke="var(--bg-elevated)" strokeWidth={2} />
          <text x={p.x} y={H - 5} textAnchor="middle" fontSize={8} fill="var(--text-tertiary)">
            {formatDate(p.date)}
          </text>
        </g>
      ))}
    </svg>
  )
}

// ─── SVG Skill Bars ─────────────────────────────────────────

function SkillBarsChart({ skillScores }: { skillScores: Partial<Record<SkillCategory, number>> }) {
  const categories = Object.entries(skillScores) as [SkillCategory, number][]
  if (categories.length === 0) return null

  const barH = 28
  const gap = 8
  const totalH = categories.length * (barH + gap)

  return (
    <div className="space-y-2">
      {categories.map(([category, score]) => (
        <div key={category} className="flex items-center gap-3">
          <span className="text-xs text-[var(--text-secondary)] w-32 text-right shrink-0">
            {SKILL_LABELS[category] || category}
          </span>
          <div className="flex-1 h-5 bg-[var(--bg-muted)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(score / 10) * 100}%`,
                backgroundColor: SKILL_COLORS[category] || 'var(--accent-color)',
              }}
            />
          </div>
          <span
            className="text-xs font-semibold w-8 text-right"
            style={{ color: scoreColor(score) }}
          >
            {score.toFixed(1)}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Session History Table ──────────────────────────────────

function SessionTable({ sessions }: { sessions: SessionSkillPoint[] }) {
  if (sessions.length === 0) return null

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border-color)]">
            <th className="text-left py-2 px-3 text-xs font-medium text-[var(--text-tertiary)]">Date</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-[var(--text-tertiary)]">Company</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-[var(--text-tertiary)]">Role</th>
            <th className="text-right py-2 px-3 text-xs font-medium text-[var(--text-tertiary)]">Score</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s, i) => (
            <tr key={i} className="border-b border-[var(--border-color)] last:border-0">
              <td className="py-2.5 px-3 text-[var(--text-tertiary)]">{formatDate(s.completedAt)}</td>
              <td className="py-2.5 px-3 text-[var(--text-primary)]">{s.companyName}</td>
              <td className="py-2.5 px-3 text-[var(--text-primary)]">{s.roleTitle}</td>
              <td className="py-2.5 px-3 text-right">
                <span className="font-semibold" style={{ color: scoreColor(s.overallScore) }}>
                  {s.overallScore}/10
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────

export default function ProgressPage() {
  const { data: authSession, status: authStatus } = useSession()
  const router = useRouter()

  const [progressData, setProgressData] = useState<ProgressData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined)
  const [showRoleMenu, setShowRoleMenu] = useState(false)

  const googleId = authSession?.user?.googleId

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/interview-prep')
    }
  }, [authStatus, router])

  useEffect(() => {
    if (!googleId) return
    let cancelled = false

    const load = async () => {
      try {
        setIsLoading(true)
        const res = await getProgress(googleId, roleFilter)
        if (cancelled) return
        if (res.success) setProgressData(res.data)
      } catch (err: unknown) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load progress data')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [googleId, roleFilter])

  // Collect unique roles for filter dropdown
  const roleOptions = useMemo(() => {
    if (!progressData) return []
    const seen = new Map<string, string>()
    for (const s of progressData.sessions) {
      if (!seen.has(s.roleId)) {
        seen.set(s.roleId, `${s.companyName} — ${s.roleTitle}`)
      }
    }
    return Array.from(seen.entries()).map(([id, label]) => ({ id, label }))
  }, [progressData])

  // Aggregate latest skill scores across all sessions for the bar chart
  const aggregatedSkillScores = useMemo(() => {
    if (!progressData || progressData.sessions.length === 0) return {}

    const totals: Partial<Record<SkillCategory, number[]>> = {}
    for (const s of progressData.sessions) {
      for (const [cat, score] of Object.entries(s.skillScores)) {
        if (!totals[cat as SkillCategory]) totals[cat as SkillCategory] = []
        totals[cat as SkillCategory]!.push(score as number)
      }
    }

    const averages: Partial<Record<SkillCategory, number>> = {}
    for (const [cat, scores] of Object.entries(totals)) {
      if (scores && scores.length > 0) {
        averages[cat as SkillCategory] = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      }
    }
    return averages
  }, [progressData])

  const activeRoleLabel = roleFilter
    ? roleOptions.find((r) => r.id === roleFilter)?.label || 'Selected Role'
    : 'All Sessions'

  // ─── Loading ────────────────────────────────────────────

  if (authStatus === 'loading' || isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto animate-pulse">
          <div className="h-8 w-48 bg-[var(--bg-muted)] rounded mb-8" />
          <div className="h-40 bg-[var(--bg-muted)] rounded-xl mb-6" />
          <div className="h-32 bg-[var(--bg-muted)] rounded-xl mb-6" />
          <div className="h-48 bg-[var(--bg-muted)] rounded-xl" />
        </div>
      </div>
    )
  }

  const sessions = progressData?.sessions ?? []
  const hasData = sessions.length > 0

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back link */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          <Link
            href="/interview-prep/history"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-tertiary)] hover:text-[var(--accent-color)] transition-colors mb-6"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to History
          </Link>
        </motion.div>

        {/* Header + role filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-light)] flex items-center justify-center">
              <ChartBarIcon className="w-5 h-5 text-[var(--accent-color)]" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Progress</h1>
          </div>

          {roleOptions.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors"
              >
                {activeRoleLabel}
                <ChevronDownIcon className="w-4 h-4" />
              </button>

              {showRoleMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowRoleMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 top-12 z-20 w-64 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl shadow-lg overflow-hidden"
                  >
                    <button
                      onClick={() => { setRoleFilter(undefined); setShowRoleMenu(false) }}
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                        !roleFilter ? 'bg-[var(--accent-light)] text-[var(--accent-color)]' : 'text-[var(--text-primary)] hover:bg-[var(--bg-muted)]'
                      }`}
                    >
                      All Sessions
                    </button>
                    {roleOptions.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => { setRoleFilter(opt.id); setShowRoleMenu(false) }}
                        className={`w-full px-4 py-2.5 text-left text-sm transition-colors truncate ${
                          roleFilter === opt.id ? 'bg-[var(--accent-light)] text-[var(--accent-color)]' : 'text-[var(--text-primary)] hover:bg-[var(--bg-muted)]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </div>
          )}
        </motion.div>

        {error && (
          <div className="mb-6 p-4 bg-[var(--error-light)] border border-[var(--error)] rounded-xl">
            <p className="text-sm text-[var(--error)]">{error}</p>
          </div>
        )}

        {!hasData ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--bg-muted)] flex items-center justify-center">
              <ChartBarIcon className="w-10 h-10 text-[var(--text-tertiary)]" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
              No completed sessions yet
            </h3>
            <p className="text-[var(--text-secondary)] mb-6">
              Complete an interview to start tracking your progress.
            </p>
            <Link href="/interview-prep">
              <Button variant="primary">Browse Roles</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Score Trend */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl p-5"
            >
              <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
                Score Trend
              </h2>
              <ScoreTrendChart sessions={sessions} />
            </motion.div>

            {/* Skill Scores */}
            {Object.keys(aggregatedSkillScores).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl p-5"
              >
                <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
                  Average Skill Scores
                </h2>
                <SkillBarsChart skillScores={aggregatedSkillScores} />
              </motion.div>
            )}

            {/* Session History Table */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl p-5"
            >
              <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
                Session History
              </h2>
              <SessionTable sessions={sessions} />
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}

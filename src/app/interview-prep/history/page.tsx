'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  MagnifyingGlassIcon,
  ChevronDownIcon,
  TrashIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LEVEL_VARIANT } from '@/components/interview-prep/RoleDetailsContent'
import { listInterviewSessions, deleteInterviewSession } from '@/services/interviewSessionService'
import type { InterviewSessionListItem, InterviewSessionStatus } from '@/types/interviewSession'

type SortOrder = 'newest' | 'oldest'

const STATUS_CONFIG: Record<
  InterviewSessionStatus,
  { label: string; Icon: typeof ClockIcon; badgeVariant: 'warning' | 'success' | 'error' }
> = {
  in_progress: { label: 'In Progress', Icon: ClockIcon, badgeVariant: 'warning' },
  completed: { label: 'Completed', Icon: CheckCircleIcon, badgeVariant: 'success' },
  abandoned: { label: 'Abandoned', Icon: XCircleIcon, badgeVariant: 'error' },
}

const STATUS_OPTIONS: Array<{ value: InterviewSessionStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All Statuses' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'abandoned', label: 'Abandoned' },
]

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function InterviewHistoryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [sessions, setSessions] = useState<InterviewSessionListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Toolbar state
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')
  const [statusFilter, setStatusFilter] = useState<InterviewSessionStatus | 'all'>('all')
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<InterviewSessionListItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/interview-prep')
    }
  }, [status, router])

  // Fetch sessions
  useEffect(() => {
    const fetchSessions = async () => {
      if (!session?.user?.googleId) return

      try {
        setIsLoading(true)
        setError(null)
        const response = await listInterviewSessions(session.user.googleId)
        if (response.success) {
          setSessions(response.data)
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load interview sessions'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    if (session?.user?.googleId) {
      fetchSessions()
    }
  }, [session?.user?.googleId])

  // Filter and sort
  const filteredSessions = useMemo(() => {
    let result = [...sessions]

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (s) =>
          s.role.title.toLowerCase().includes(q) ||
          s.company.name.toLowerCase().includes(q)
      )
    }

    if (statusFilter !== 'all') {
      result = result.filter((s) => s.status === statusFilter)
    }

    result.sort((a, b) => {
      const dateA = new Date(a.startedAt).getTime()
      const dateB = new Date(b.startedAt).getTime()
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
    })

    return result
  }, [sessions, searchQuery, statusFilter, sortOrder])

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || !session?.user?.googleId) return

    try {
      setIsDeleting(true)
      await deleteInterviewSession(deleteTarget.id, session.user.googleId)
      setSessions((prev) => prev.filter((s) => s.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete session'
      setError(message)
      setDeleteTarget(null)
    } finally {
      setIsDeleting(false)
    }
  }

  const activeStatusLabel =
    STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label ?? 'All Statuses'

  // ─── Loading State ────────────────────────────────────

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-10 w-64 bg-[var(--bg-muted)] rounded-lg mb-8" />
            <div className="flex gap-3 mb-8">
              <div className="h-12 w-80 bg-[var(--bg-muted)] rounded-xl" />
              <div className="h-12 w-36 bg-[var(--bg-muted)] rounded-xl" />
              <div className="h-12 w-32 bg-[var(--bg-muted)] rounded-xl" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-40 bg-[var(--bg-muted)] rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Main Render ──────────────────────────────────────

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">
              Interview History
            </h1>
            <Link href="/interview-prep">
              <Button variant="outline" size="md">
                Browse Roles
              </Button>
            </Link>
          </div>

          {/* Toolbar: Search + Status Filter + Sort */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by role or company..."
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]/50"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowStatusMenu(!showStatusMenu)
                  setShowSortMenu(false)
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors whitespace-nowrap"
              >
                {activeStatusLabel}
                <ChevronDownIcon className="w-4 h-4" />
              </button>

              {showStatusMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowStatusMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 top-12 z-20 w-40 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl shadow-lg overflow-hidden"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setStatusFilter(opt.value)
                          setShowStatusMenu(false)
                        }}
                        className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                          statusFilter === opt.value
                            ? 'bg-[var(--accent-light)] text-[var(--accent-color)]'
                            : 'text-[var(--text-primary)] hover:bg-[var(--bg-muted)]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </div>

            {/* Sort */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowSortMenu(!showSortMenu)
                  setShowStatusMenu(false)
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors whitespace-nowrap"
              >
                Sort: {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
                <ChevronDownIcon className="w-4 h-4" />
              </button>

              {showSortMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowSortMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 top-12 z-20 w-36 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl shadow-lg overflow-hidden"
                  >
                    <button
                      onClick={() => {
                        setSortOrder('newest')
                        setShowSortMenu(false)
                      }}
                      className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                        sortOrder === 'newest'
                          ? 'bg-[var(--accent-light)] text-[var(--accent-color)]'
                          : 'text-[var(--text-primary)] hover:bg-[var(--bg-muted)]'
                      }`}
                    >
                      Newest first
                    </button>
                    <button
                      onClick={() => {
                        setSortOrder('oldest')
                        setShowSortMenu(false)
                      }}
                      className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                        sortOrder === 'oldest'
                          ? 'bg-[var(--accent-light)] text-[var(--accent-color)]'
                          : 'text-[var(--text-primary)] hover:bg-[var(--bg-muted)]'
                      }`}
                    >
                      Oldest first
                    </button>
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-[var(--error-light)] border border-[var(--error)] rounded-xl">
            <p className="text-sm text-[var(--error)]">{error}</p>
          </div>
        )}

        {/* Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {filteredSessions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSessions.map((s, index) => {
                const config = STATUS_CONFIG[s.status]
                const StatusIcon = config.Icon

                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl overflow-hidden hover:border-[var(--accent-color)] transition-colors"
                  >
                    <Link
                      href={
                        s.status === 'in_progress'
                          ? `/interview-prep/session/${s.id}`
                          : s.status === 'completed'
                            ? `/interview-prep/session/${s.id}/results`
                            : `/interview-prep/${s.company.id}/roles/${s.role.id}/briefing`
                      }
                      className="block p-5"
                    >
                      {/* Card header */}
                      <div className="flex items-start gap-3 mb-3">
                        {/* Company logo */}
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[var(--bg-muted)] border border-[var(--border-color)] flex items-center justify-center overflow-hidden">
                          {s.company.logo ? (
                            <img
                              src={s.company.logo}
                              alt={s.company.name}
                              className="w-full h-full object-contain p-1"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                target.nextElementSibling?.classList.remove('hidden')
                              }}
                            />
                          ) : null}
                          <span
                            className={`text-sm font-bold ${s.company.logo ? 'hidden' : ''}`}
                            style={{ color: 'var(--accent-color)' }}
                          >
                            {s.company.name.charAt(0)}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[var(--text-tertiary)] mb-0.5 truncate">
                            {s.company.name}
                          </p>
                          <h3 className="font-semibold text-[var(--text-primary)] truncate group-hover:text-[var(--accent-color)] transition-colors">
                            {s.role.title}
                          </h3>
                        </div>
                      </div>

                      {/* Status + meta */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={config.badgeVariant} size="sm">
                          <StatusIcon className="w-3 h-3" />
                          {config.label}
                        </Badge>
                        <Badge variant={LEVEL_VARIANT[s.role.level as keyof typeof LEVEL_VARIANT] ?? 'default'} size="sm">
                          {s.role.level}
                        </Badge>
                      </div>

                      {/* Date + score */}
                      <div className="flex items-center justify-between mt-3 text-xs text-[var(--text-tertiary)]">
                        <span>{formatDate(s.startedAt)}</span>
                        {s.overallScore !== null && (
                          <span className="font-medium text-[var(--text-primary)]">
                            Score: {s.overallScore}/10
                          </span>
                        )}
                        {s.roundCount > 0 && s.overallScore === null && (
                          <span>{s.roundCount} round{s.roundCount !== 1 ? 's' : ''}</span>
                        )}
                      </div>
                    </Link>

                    {/* Delete action */}
                    <div className="px-5 pb-4 flex justify-end border-t border-[var(--border-color)] pt-3">
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          setDeleteTarget(s)
                        }}
                        className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--error)] hover:bg-[var(--error-light)] transition-colors"
                        title="Delete session"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--bg-muted)] flex items-center justify-center">
                <BriefcaseIcon className="w-10 h-10 text-[var(--text-tertiary)]" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                {searchQuery || statusFilter !== 'all'
                  ? 'No sessions match your filters'
                  : 'No interview sessions yet'}
              </h3>
              <p className="text-[var(--text-secondary)] mb-6">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try a different search term or filter'
                  : 'Start a mock interview to track your progress'}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Link href="/interview-prep">
                  <Button variant="primary" size="lg">
                    Browse Interview Roles
                  </Button>
                </Link>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setDeleteTarget(null)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-2xl p-6 max-w-md w-full shadow-xl"
          >
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              Delete Interview Session
            </h3>
            <p className="text-[var(--text-secondary)] mb-6">
              Are you sure you want to delete the{' '}
              <span className="font-medium text-[var(--text-primary)]">
                {deleteTarget.role.title}
              </span>{' '}
              session at{' '}
              <span className="font-medium text-[var(--text-primary)]">
                {deleteTarget.company.name}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="ghost"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleDeleteConfirm}
                isLoading={isDeleting}
                className="bg-[var(--error)] hover:bg-[var(--error)]"
              >
                Delete
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

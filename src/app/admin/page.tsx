'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ChevronDownIcon,
  XMarkIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'
import {
  listCompanies,
  listSubmissions,
  getSubmissionDetails,
  approveSubmission,
  rejectSubmission,
} from '@/services/interviewPrepService'
import {
  SubmissionsTable,
  SubmissionDetailModal,
  ApproveSubmissionModal,
  RejectSubmissionModal,
} from '@/components/admin'
import { Badge } from '@/components/ui/badge'
import type {
  SubmissionStatus,
  SubmissionSource,
  SubmissionListItem,
  SubmissionDetails,
  CompanyListItem,
  ApproveSubmissionRequest,
  RejectSubmissionRequest,
} from '@/types/interviewPrep'

// ─── Modal State Machine ──────────────────────────────

type ModalState =
  | { type: 'none' }
  | { type: 'detail'; submission: SubmissionListItem }
  | { type: 'approve'; submission: SubmissionListItem }
  | { type: 'reject'; submission: SubmissionListItem }

// ─── Filter Options ───────────────────────────────────

const STATUS_OPTIONS: { value: SubmissionStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

const SOURCE_OPTIONS: { value: SubmissionSource | 'all'; label: string }[] = [
  { value: 'all', label: 'All Sources' },
  { value: 'user', label: 'User' },
  { value: 'scraper', label: 'Scraper' },
]

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const googleId = session?.user?.googleId

  // ─── Data State ───────────────────────────────────

  const [submissions, setSubmissions] = useState<SubmissionListItem[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Detail data (fetched when row is clicked)
  const [detailData, setDetailData] = useState<SubmissionDetails | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)

  // Companies for linking dropdown
  const [companies, setCompanies] = useState<CompanyListItem[]>([])

  // ─── Filter State ─────────────────────────────────

  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | 'all'>('pending')
  const [sourceFilter, setSourceFilter] = useState<SubmissionSource | 'all'>('all')
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [showSourceMenu, setShowSourceMenu] = useState(false)

  // ─── Modal State ──────────────────────────────────

  const [modal, setModal] = useState<ModalState>({ type: 'none' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ─── Auth Guard ───────────────────────────────────

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth')
    } else if (status === 'authenticated' && !session?.user?.isAdmin) {
      router.push('/')
    }
  }, [status, session, router])

  // ─── Fetch Submissions ────────────────────────────

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.isAdmin || !googleId) return

    const fetchSubmissions = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const params: { status?: SubmissionStatus; source?: SubmissionSource } = {}
        if (statusFilter !== 'all') params.status = statusFilter
        if (sourceFilter !== 'all') params.source = sourceFilter

        const response = await listSubmissions(params, googleId)
        if (response.success) {
          setSubmissions(response.data)
          setTotal(response.total)
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load submissions'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubmissions()
  }, [status, session, googleId, statusFilter, sourceFilter])

  // ─── Fetch Companies (once) ───────────────────────

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.isAdmin) return

    const fetchCompanies = async () => {
      try {
        const response = await listCompanies()
        if (response.success) {
          setCompanies(response.data)
        }
      } catch {
        // Silent — dropdown will just be empty
      }
    }

    fetchCompanies()
  }, [status, session])

  // Track which detail request is active (prevents race conditions on rapid clicks)
  const activeDetailRequestRef = useRef<string | null>(null)

  // ─── Handlers ─────────────────────────────────────

  const handleRowClick = async (submission: SubmissionListItem) => {
    if (!googleId) return
    const requestId = submission.id
    activeDetailRequestRef.current = requestId

    setModal({ type: 'detail', submission })
    setIsLoadingDetail(true)
    setDetailData(null)

    try {
      const response = await getSubmissionDetails(submission.id, googleId)
      if (response.success && activeDetailRequestRef.current === requestId) {
        setDetailData(response.data)
      }
    } catch (err: unknown) {
      if (activeDetailRequestRef.current === requestId) {
        const message = err instanceof Error ? err.message : 'Failed to load submission details'
        setError(message)
        setModal({ type: 'none' })
      }
    } finally {
      if (activeDetailRequestRef.current === requestId) {
        setIsLoadingDetail(false)
      }
    }
  }

  const handleApprove = async (data: ApproveSubmissionRequest) => {
    if (modal.type !== 'approve' || !googleId) return

    try {
      setIsSubmitting(true)
      setError(null)
      const response = await approveSubmission(modal.submission.id, data, googleId)
      if (response.success) {
        setSubmissions(prev =>
          prev.map(s =>
            s.id === modal.submission.id
              ? { ...s, status: 'approved' as const }
              : s
          )
        )
        setModal({ type: 'none' })
        setDetailData(null)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to approve submission'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async (data: RejectSubmissionRequest) => {
    if (modal.type !== 'reject' || !googleId) return

    try {
      setIsSubmitting(true)
      setError(null)
      const response = await rejectSubmission(modal.submission.id, data, googleId)
      if (response.success) {
        setSubmissions(prev =>
          prev.map(s =>
            s.id === modal.submission.id
              ? { ...s, status: 'rejected' as const }
              : s
          )
        )
        setModal({ type: 'none' })
        setDetailData(null)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reject submission'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─── Auth Loading / Not Admin Guard ───────────────

  if (status === 'loading') {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-10 w-56 bg-[var(--bg-muted)] rounded-lg mb-2" />
            <div className="h-5 w-80 bg-[var(--bg-muted)] rounded-lg mb-8" />
            <div className="flex gap-3 mb-8">
              <div className="h-11 w-36 bg-[var(--bg-muted)] rounded-xl" />
              <div className="h-11 w-32 bg-[var(--bg-muted)] rounded-xl" />
            </div>
            <div className="h-80 bg-[var(--bg-muted)] rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!session?.user?.isAdmin) return null

  // ─── Pending Count ────────────────────────────────

  const pendingCount = statusFilter === 'pending'
    ? total
    : submissions.filter(s => s.status === 'pending').length

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheckIcon className="w-8 h-8 text-[var(--accent-color)]" />
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">
              Admin Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-[var(--text-secondary)]">
              Review and manage external submissions
            </p>
            {pendingCount > 0 && (
              <Badge variant="warning" size="sm">
                {pendingCount} pending
              </Badge>
            )}
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex flex-wrap gap-3 mb-6"
        >
          {/* Status Filter */}
          <div className="relative">
            <button
              onClick={() => {
                setShowStatusMenu(!showStatusMenu)
                setShowSourceMenu(false)
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors whitespace-nowrap"
            >
              {STATUS_OPTIONS.find(o => o.value === statusFilter)?.label}
              <ChevronDownIcon className="w-4 h-4" />
            </button>

            {showStatusMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowStatusMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute left-0 top-12 z-20 w-40 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl shadow-lg overflow-hidden"
                >
                  {STATUS_OPTIONS.map(opt => (
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

          {/* Source Filter */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSourceMenu(!showSourceMenu)
                setShowStatusMenu(false)
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors whitespace-nowrap"
            >
              {SOURCE_OPTIONS.find(o => o.value === sourceFilter)?.label}
              <ChevronDownIcon className="w-4 h-4" />
            </button>

            {showSourceMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSourceMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute left-0 top-12 z-20 w-36 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl shadow-lg overflow-hidden"
                >
                  {SOURCE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setSourceFilter(opt.value)
                        setShowSourceMenu(false)
                      }}
                      className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                        sourceFilter === opt.value
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

          {/* Result count */}
          {!isLoading && (
            <span className="flex items-center text-sm text-[var(--text-tertiary)]">
              {total} submission{total !== 1 ? 's' : ''}
            </span>
          )}
        </motion.div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-[var(--error-light)] border border-[var(--error)] rounded-xl flex items-center justify-between">
            <p className="text-sm text-[var(--error)]">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-[var(--error)] hover:text-[var(--error)]/80"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <SubmissionsTable
            submissions={submissions}
            onRowClick={handleRowClick}
            isLoading={isLoading}
          />
        </motion.div>
      </div>

      {/* ─── Modals ──────────────────────────────────── */}

      <SubmissionDetailModal
        isOpen={modal.type === 'detail'}
        onClose={() => { setModal({ type: 'none' }); setDetailData(null) }}
        submission={detailData}
        isLoadingDetail={isLoadingDetail}
        onApprove={() => {
          if (modal.type === 'detail') setModal({ type: 'approve', submission: modal.submission })
        }}
        onReject={() => {
          if (modal.type === 'detail') setModal({ type: 'reject', submission: modal.submission })
        }}
      />

      <ApproveSubmissionModal
        isOpen={modal.type === 'approve'}
        onClose={() => {
          if (modal.type === 'approve') setModal({ type: 'detail', submission: modal.submission })
        }}
        submission={modal.type === 'approve' ? modal.submission : null}
        companies={companies}
        onSubmit={handleApprove}
        isSubmitting={isSubmitting}
      />

      <RejectSubmissionModal
        isOpen={modal.type === 'reject'}
        onClose={() => {
          if (modal.type === 'reject') setModal({ type: 'detail', submission: modal.submission })
        }}
        submission={modal.type === 'reject' ? modal.submission : null}
        onSubmit={handleReject}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}

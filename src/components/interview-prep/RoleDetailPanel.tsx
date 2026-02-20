'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  PencilSquareIcon,
  TrashIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline'
import { Badge } from '@/components/ui/badge'
import { ModalShell } from '@/components/ui/ModalShell'
import { RoleDetailsContent, LEVEL_VARIANT } from './RoleDetailsContent'
import { getRoleDetails } from '@/services/interviewPrepService'
import type { RoleSummary, RoleDetails } from '@/types/interviewPrep'

// ─── Props ──────────────────────────────────────────

interface RoleDetailPanelProps {
  isOpen: boolean
  roleId: string
  companyId: string
  detailsCache: React.MutableRefObject<Map<string, RoleDetails>>
  onClose: () => void
  isAdmin: boolean
  onEdit: (role: RoleDetails) => void
  onDelete: (role: RoleSummary) => void
}

// ─── Component ──────────────────────────────────────

export function RoleDetailPanel({
  isOpen,
  roleId,
  companyId,
  detailsCache,
  onClose,
  isAdmin,
  onEdit,
  onDelete,
}: RoleDetailPanelProps) {
  const [details, setDetails] = useState<RoleDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // ─── Fetch details ──────────────────────────────────

  useEffect(() => {
    if (!roleId) return
    let cancelled = false

    const cached = detailsCache.current.get(roleId)
    if (cached) {
      setDetails(cached)
      setIsLoading(false)
      setFetchError(null)
      return
    }

    const fetchDetails = async () => {
      try {
        setIsLoading(true)
        setFetchError(null)
        const res = await getRoleDetails(roleId)
        if (cancelled) return
        if (res.success) {
          detailsCache.current.set(roleId, res.data)
          setDetails(res.data)
        } else {
          setFetchError('Failed to load role details')
        }
      } catch (err: unknown) {
        if (cancelled) return
        const message = err instanceof Error ? err.message : 'Failed to load role details'
        setFetchError(message)
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchDetails()

    return () => {
      cancelled = true
    }
  }, [roleId, retryCount, detailsCache])

  // ─── Retry handler ──────────────────────────────────

  const handleRetry = () => {
    detailsCache.current.delete(roleId)
    setRetryCount((c) => c + 1)
  }

  // ─── Render ─────────────────────────────────────────

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={details?.title ?? 'Role Details'}
      size="2xl"
    >
      {/* ─── Action Bar: View Full Details + Admin ─── */}
      <div className="flex items-center justify-between mb-4">
        <Link
          href={`/interview-prep/${companyId}/roles/${roleId}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent-color)] hover:underline"
        >
          View Full Details
          <ArrowTopRightOnSquareIcon className="w-4 h-4" />
        </Link>

        {isAdmin && details && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(details)}
              className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--accent-color)] hover:bg-[var(--accent-light)] transition-colors"
              title="Edit role"
            >
              <PencilSquareIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() =>
                onDelete({
                  id: details.id,
                  title: details.title,
                  level: details.level,
                  department: details.department,
                  description: details.description,
                  roundCount: details.rounds.length,
                })
              }
              className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--error)] hover:bg-[var(--error-light)] transition-colors"
              title="Delete role"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ─── Level + Department ─── */}
      {details && (
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <Badge variant={LEVEL_VARIANT[details.level]} size="sm">
            {details.level}
          </Badge>
          {details.department && (
            <span className="text-xs text-[var(--text-tertiary)]">
              {details.department}
            </span>
          )}
        </div>
      )}

      {/* ─── Content ─── */}
      <div>
        {/* Loading skeleton */}
        {isLoading && (
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-32 bg-[var(--bg-muted)] rounded" />
            <div className="h-20 bg-[var(--bg-muted)] rounded-xl" />
            <div className="h-20 bg-[var(--bg-muted)] rounded-xl" />
          </div>
        )}

        {/* Error state */}
        {fetchError && !isLoading && (
          <div className="text-center py-8">
            <p className="text-sm text-[var(--error)] mb-3">{fetchError}</p>
            <button
              onClick={handleRetry}
              className="px-4 py-2 text-sm font-medium text-[var(--accent-color)] bg-[var(--accent-light)] rounded-lg hover:opacity-80 transition-opacity"
            >
              Try again
            </button>
          </div>
        )}

        {/* Details loaded — delegate to shared content component */}
        {details && !isLoading && !fetchError && (
          <RoleDetailsContent
            details={details}
            isAdmin={isAdmin}
            onEdit={onEdit}
            onDelete={onDelete}
            showHeader={false}
          />
        )}
      </div>
    </ModalShell>
  )
}

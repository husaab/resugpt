'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import {
  ArrowLeftIcon,
  PencilSquareIcon,
  TrashIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  RoleDetailsContent,
  EditRoleModal,
  DeleteRoleModal,
} from '@/components/interview-prep'
import { LEVEL_VARIANT } from '@/components/interview-prep/RoleDetailsContent'
import type { RoleFormData } from '@/components/interview-prep/RoleForm'
import { getRoleDetails, updateRole, deleteRole } from '@/services/interviewPrepService'
import type { RoleSummary, RoleDetails } from '@/types/interviewPrep'

type ModalState =
  | { type: 'none' }
  | { type: 'edit'; role: RoleDetails }
  | { type: 'delete'; role: RoleSummary }

export default function RoleDetailPage() {
  const { companyId, roleId } = useParams<{ companyId: string; roleId: string }>()
  const router = useRouter()
  const { data: session } = useSession()
  const isAdmin = session?.user?.isAdmin === true

  const [details, setDetails] = useState<RoleDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [modal, setModal] = useState<ModalState>({ type: 'none' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [logoFailed, setLogoFailed] = useState(false)

  // ─── Fetch details ──────────────────────────────────

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

  // ─── Admin Handlers ─────────────────────────────────

  const handleUpdateRole = async (data: RoleFormData) => {
    if (!session?.user?.googleId || modal.type !== 'edit') return
    try {
      setIsSubmitting(true)
      const res = await updateRole(roleId, {
        title: data.title,
        level: data.level,
        department: data.department || undefined,
        description: data.description || undefined,
        rounds: data.rounds.length > 0 ? data.rounds : undefined,
        tips: data.tips.length > 0 ? data.tips : undefined,
        googleId: session.user.googleId,
      })
      if (res.success) {
        // Re-fetch to get the updated details
        const updated = await getRoleDetails(roleId)
        if (updated.success) setDetails(updated.data)
        setModal({ type: 'none' })
      }
    } catch {
      // Error is shown in the modal form
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteRole = async () => {
    if (!session?.user?.googleId || modal.type !== 'delete') return
    try {
      setIsSubmitting(true)
      const res = await deleteRole(roleId, session.user.googleId)
      if (res.success) {
        setModal({ type: 'none' })
        router.push(`/interview-prep/${companyId}`)
      }
    } catch {
      // Error is shown in the modal
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRetry = () => setRetryCount((c) => c + 1)

  // ─── Loading State ──────────────────────────────────

  if (isLoading) {
    return (
      <div className="pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-5 w-40 bg-[var(--bg-muted)] rounded mb-8" />
            <div className="bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-2xl p-6 mb-8">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-xl bg-[var(--bg-muted)]" />
                <div className="space-y-2 flex-1">
                  <div className="h-7 w-48 bg-[var(--bg-muted)] rounded" />
                  <div className="h-4 w-32 bg-[var(--bg-muted)] rounded" />
                </div>
              </div>
              <div className="mt-4 h-4 w-full max-w-md bg-[var(--bg-muted)] rounded" />
            </div>
            <div className="h-10 w-64 bg-[var(--bg-muted)] rounded mb-4" />
            <div className="h-20 bg-[var(--bg-muted)] rounded-xl mb-3" />
            <div className="h-20 bg-[var(--bg-muted)] rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  // ─── Error / 404 State ──────────────────────────────

  if (error || !details) {
    return (
      <div className="pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto text-center py-20">
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
              onClick={handleRetry}
              className="px-4 py-2 text-sm font-medium text-[var(--accent-color)] bg-[var(--accent-light)] rounded-lg hover:opacity-80 transition-opacity"
            >
              Try again
            </button>
            <Link href={`/interview-prep/${companyId}`}>
              <Button variant="primary">Back to Company</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ─── Main Render ────────────────────────────────────

  const company = details.company

  return (
    <div className="pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back link */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          <Link
            href={`/interview-prep/${companyId}`}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-tertiary)] hover:text-[var(--accent-color)] transition-colors mb-8"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to {company.name}
          </Link>
        </motion.div>

        {/* Page Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-2xl p-6 mb-8"
        >
          <div className="flex items-start justify-between gap-4">
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
                  <span
                    className="text-lg font-bold"
                    style={{ color: 'var(--accent-color)' }}
                  >
                    {company.name.charAt(0)}
                  </span>
                )}
              </div>

              <div>
                <p className="text-sm text-[var(--text-tertiary)] mb-0.5">
                  {company.name}
                </p>
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                  {details.title}
                </h1>
                <div className="flex items-center gap-2 flex-wrap mt-1.5">
                  <Badge variant={LEVEL_VARIANT[details.level]} size="sm">
                    {details.level}
                  </Badge>
                  {details.department && (
                    <span className="text-sm text-[var(--text-tertiary)]">
                      {details.department}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Admin actions */}
            {isAdmin && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => setModal({ type: 'edit', role: details })}
                  className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--accent-color)] hover:bg-[var(--accent-light)] transition-colors"
                  title="Edit role"
                >
                  <PencilSquareIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() =>
                    setModal({
                      type: 'delete',
                      role: {
                        id: details.id,
                        title: details.title,
                        level: details.level,
                        department: details.department,
                        description: details.description,
                        roundCount: details.rounds.length,
                      },
                    })
                  }
                  className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--error)] hover:bg-[var(--error-light)] transition-colors"
                  title="Delete role"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Description */}
          {details.description && (
            <p className="text-sm text-[var(--text-secondary)] mt-4">
              {details.description}
            </p>
          )}
        </motion.div>

        {/* Role Details Content (tabs + tab bodies) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <RoleDetailsContent
            details={details}
            isAdmin={isAdmin}
            onEdit={(d) => setModal({ type: 'edit', role: d })}
            onDelete={(s) => setModal({ type: 'delete', role: s })}
            showHeader={false}
            multiOpen
            defaultOpenFirst
          />
        </motion.div>
      </div>

      {/* ─── Admin Modals ─── */}

      <EditRoleModal
        isOpen={modal.type === 'edit'}
        onClose={() => setModal({ type: 'none' })}
        onSubmit={handleUpdateRole}
        role={modal.type === 'edit' ? modal.role : null}
        isSubmitting={isSubmitting}
      />

      <DeleteRoleModal
        isOpen={modal.type === 'delete'}
        onClose={() => setModal({ type: 'none' })}
        onConfirm={handleDeleteRole}
        role={modal.type === 'delete' ? modal.role : null}
        isSubmitting={isSubmitting}
      />

    </div>
  )
}

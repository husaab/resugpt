'use client'

import { useState } from 'react'
import { ModalShell } from '@/components/ui/ModalShell'
import { Button } from '@/components/ui/button'
import type { RejectSubmissionRequest, SubmissionListItem } from '@/types/interviewPrep'

interface RejectSubmissionModalProps {
  isOpen: boolean
  onClose: () => void
  submission: SubmissionListItem | null
  onSubmit: (data: RejectSubmissionRequest) => Promise<void>
  isSubmitting: boolean
}

export function RejectSubmissionModal({
  isOpen,
  onClose,
  submission,
  onSubmit,
  isSubmitting,
}: RejectSubmissionModalProps) {
  const [rejectionReason, setRejectionReason] = useState('')
  const [reviewNotes, setReviewNotes] = useState('')

  const handleSubmit = async () => {
    if (!rejectionReason.trim()) return
    await onSubmit({
      rejectionReason: rejectionReason.trim(),
      ...(reviewNotes.trim() ? { reviewNotes: reviewNotes.trim() } : {}),
    })
  }

  const handleClose = () => {
    setRejectionReason('')
    setReviewNotes('')
    onClose()
  }

  if (!submission) return null

  return (
    <ModalShell isOpen={isOpen} onClose={handleClose} title="Reject Submission" size="lg">
      <div className="space-y-5">
        {/* Summary */}
        <div className="p-3 bg-[var(--error-light)] border border-[var(--error)]/20 rounded-lg">
          <p className="text-sm text-[var(--text-secondary)]">
            Rejecting submission for <span className="font-semibold text-[var(--text-primary)]">{submission.roleTitle}</span> at{' '}
            <span className="font-semibold text-[var(--text-primary)]">{submission.companyName}</span>
          </p>
        </div>

        {/* Rejection Reason */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text-primary)]">
            Rejection Reason <span className="text-[var(--error)]">*</span>
          </label>
          <p className="text-xs text-[var(--text-tertiary)]">
            This will be visible to the user who submitted.
          </p>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="e.g., Insufficient details, duplicate submission, unverifiable data..."
            rows={3}
            className="w-full px-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]/50 resize-none"
          />
        </div>

        {/* Review Notes */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text-primary)]">
            Review Notes <span className="text-[var(--text-tertiary)] font-normal">(optional, internal)</span>
          </label>
          <textarea
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            placeholder="Internal notes about this rejection..."
            rows={2}
            className="w-full px-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]/50 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-3 border-t border-[var(--border-color)]">
          <Button variant="secondary" size="md" onClick={handleClose} disabled={isSubmitting}>
            Back
          </Button>
          <Button
            variant="destructive"
            size="md"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={!rejectionReason.trim()}
          >
            Reject Submission
          </Button>
        </div>
      </div>
    </ModalShell>
  )
}

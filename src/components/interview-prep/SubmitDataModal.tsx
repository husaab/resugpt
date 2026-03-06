'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { ModalShell } from '@/components/ui/ModalShell'
import { SubmissionForm, type SubmissionFormData } from './SubmissionForm'
import { submitExternalData } from '@/services/interviewPrepService'
import type { CompanyListItem } from '@/types/interviewPrep'

interface SubmitDataModalProps {
  isOpen: boolean
  onClose: () => void
  companies: CompanyListItem[]
  preSelectedCompanyId?: string
}

export function SubmitDataModal({
  isOpen,
  onClose,
  companies,
  preSelectedCompanyId,
}: SubmitDataModalProps) {
  const { data: session } = useSession()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (formData: SubmissionFormData) => {
    if (!session?.user?.googleId) {
      setError('You must be logged in to submit data')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      // Build the company payload
      const companyPayload = formData.selectedCompanyId
        ? {
            name:
              companies.find((c) => c.id === formData.selectedCompanyId)?.name ||
              formData.newCompany.name,
          }
        : {
            name: formData.newCompany.name,
            industry: formData.newCompany.industry || undefined,
            description: formData.newCompany.description || undefined,
            interviewStyle: formData.newCompany.interviewStyle || undefined,
          }

      // Build the role payload
      const rolePayload = {
        title: formData.role.title,
        level: formData.role.level,
        department: formData.role.department || undefined,
        description: formData.role.description || undefined,
        rounds: formData.rounds.length > 0 ? formData.rounds : undefined,
        tips: formData.role.tips.length > 0 ? formData.role.tips : undefined,
      }

      const response = await submitExternalData(
        { company: companyPayload, role: rolePayload },
        session.user.googleId
      )

      if (response.success) {
        setSuccess(true)
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to submit data'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setError(null)
    setSuccess(false)
    onClose()
  }

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={handleClose}
      title="Submit Interview Data"
      size="xl"
    >
      {/* Success State */}
      {success ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-600 dark:text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            Submission Received!
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mb-1">
            Your interview data has been submitted for review.
          </p>
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            Don&apos;t forget to forward proof of your interview to{' '}
            <a
              href="mailto:submissions@resugpt.com"
              className="font-semibold text-[var(--accent-color)] hover:underline"
            >
              submissions@resugpt.com
            </a>
          </p>
          <button
            onClick={handleClose}
            className="px-6 py-2.5 bg-[var(--accent-color)] text-white rounded-xl font-medium hover:bg-[var(--accent-hover)] transition-colors"
          >
            Done
          </button>
        </div>
      ) : (
        <>
          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-3 bg-[var(--error-light)] border border-[var(--error)] rounded-xl flex items-center justify-between">
              <p className="text-sm text-[var(--error)]">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-[var(--error)] hover:text-[var(--error)]/80 flex-shrink-0 ml-2"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Auth Check */}
          {!session?.user?.googleId ? (
            <div className="text-center py-8">
              <p className="text-[var(--text-secondary)] mb-2">
                You must be signed in to submit interview data.
              </p>
              <p className="text-sm text-[var(--text-tertiary)]">
                Please sign in and try again.
              </p>
            </div>
          ) : (
            <SubmissionForm
              companies={companies}
              preSelectedCompanyId={preSelectedCompanyId}
              onSubmit={handleSubmit}
              onCancel={handleClose}
              isSubmitting={isSubmitting}
            />
          )}
        </>
      )}
    </ModalShell>
  )
}

'use client'

import { useState, useMemo } from 'react'
import { MagnifyingGlassIcon, PlusIcon, LinkIcon } from '@heroicons/react/24/outline'
import { ModalShell } from '@/components/ui/ModalShell'
import { Button } from '@/components/ui/button'
import type { CompanyListItem, ApproveSubmissionRequest, SubmissionListItem } from '@/types/interviewPrep'

interface ApproveSubmissionModalProps {
  isOpen: boolean
  onClose: () => void
  submission: SubmissionListItem | null
  companies: CompanyListItem[]
  onSubmit: (data: ApproveSubmissionRequest) => Promise<void>
  isSubmitting: boolean
}

export function ApproveSubmissionModal({
  isOpen,
  onClose,
  submission,
  companies,
  onSubmit,
  isSubmitting,
}: ApproveSubmissionModalProps) {
  const [linkMode, setLinkMode] = useState<'create' | 'link'>('create')
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [companySearch, setCompanySearch] = useState('')
  const [reviewNotes, setReviewNotes] = useState('')

  const filteredCompanies = useMemo(() => {
    if (!companySearch) return companies
    const q = companySearch.toLowerCase()
    return companies.filter(c => c.name.toLowerCase().includes(q))
  }, [companies, companySearch])

  const handleSubmit = async () => {
    if (linkMode === 'link' && !selectedCompanyId) return

    const data: ApproveSubmissionRequest = {}
    if (linkMode === 'link' && selectedCompanyId) {
      data.linkedCompanyId = selectedCompanyId
    }
    if (reviewNotes.trim()) {
      data.reviewNotes = reviewNotes.trim()
    }
    await onSubmit(data)
  }

  const handleClose = () => {
    setLinkMode('create')
    setSelectedCompanyId('')
    setCompanySearch('')
    setReviewNotes('')
    onClose()
  }

  if (!submission) return null

  return (
    <ModalShell isOpen={isOpen} onClose={handleClose} title="Approve Submission" size="lg">
      <div className="space-y-5">
        {/* Summary */}
        <div className="p-3 bg-[var(--bg-muted)] rounded-lg">
          <p className="text-sm text-[var(--text-secondary)]">
            Approving submission for <span className="font-semibold text-[var(--text-primary)]">{submission.roleTitle}</span> at{' '}
            <span className="font-semibold text-[var(--text-primary)]">{submission.companyName}</span>
          </p>
        </div>

        {/* Company Resolution */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-[var(--text-primary)]">
            Company Resolution
          </label>

          <div className="flex gap-2">
            <button
              onClick={() => { setLinkMode('create'); setSelectedCompanyId('') }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                linkMode === 'create'
                  ? 'border-[var(--accent-color)] bg-[var(--accent-light)] text-[var(--accent-color)]'
                  : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]'
              }`}
            >
              <PlusIcon className="w-4 h-4" />
              Create New Company
            </button>
            <button
              onClick={() => setLinkMode('link')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                linkMode === 'link'
                  ? 'border-[var(--accent-color)] bg-[var(--accent-light)] text-[var(--accent-color)]'
                  : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]'
              }`}
            >
              <LinkIcon className="w-4 h-4" />
              Link to Existing
            </button>
          </div>

          {linkMode === 'link' && (
            <div className="space-y-2">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
                <input
                  type="text"
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  placeholder="Search companies..."
                  className="w-full pl-9 pr-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]/50"
                />
              </div>
              <div className="max-h-40 overflow-y-auto border border-[var(--border-color)] rounded-lg">
                {filteredCompanies.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-[var(--text-tertiary)]">No companies found</p>
                ) : (
                  filteredCompanies.map(company => (
                    <button
                      key={company.id}
                      onClick={() => setSelectedCompanyId(company.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                        selectedCompanyId === company.id
                          ? 'bg-[var(--accent-light)] text-[var(--accent-color)]'
                          : 'text-[var(--text-primary)] hover:bg-[var(--bg-muted)]'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-md bg-[var(--bg-muted)] border border-[var(--border-color)] flex items-center justify-center overflow-hidden flex-shrink-0">
                        {company.logo ? (
                          <img src={company.logo} alt="" className="w-full h-full object-contain p-0.5" />
                        ) : (
                          <span className="text-xs font-bold" style={{ color: 'var(--accent-color)' }}>
                            {company.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="font-medium">{company.name}</span>
                        {company.industry && (
                          <span className="text-xs text-[var(--text-tertiary)] ml-2">{company.industry}</span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
              {linkMode === 'link' && !selectedCompanyId && (
                <p className="text-xs text-[var(--warning)]">Select a company to link to</p>
              )}
            </div>
          )}
        </div>

        {/* Review Notes */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text-primary)]">
            Review Notes <span className="text-[var(--text-tertiary)] font-normal">(optional, internal)</span>
          </label>
          <textarea
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            placeholder="Any notes about this approval..."
            rows={3}
            className="w-full px-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]/50 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-3 border-t border-[var(--border-color)]">
          <Button variant="secondary" size="md" onClick={handleClose} disabled={isSubmitting}>
            Back
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={linkMode === 'link' && !selectedCompanyId}
          >
            Approve Submission
          </Button>
        </div>
      </div>
    </ModalShell>
  )
}

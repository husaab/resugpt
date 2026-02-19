'use client'

import { PencilSquareIcon } from '@heroicons/react/24/outline'
import { ModalShell } from '@/components/ui/ModalShell'
import { Button } from '@/components/ui/button'
import type { CompanyListItem } from '@/types/interviewPrep'

interface ViewCompanyModalProps {
  isOpen: boolean
  onClose: () => void
  onEdit: () => void
  company: CompanyListItem | null
}

export function ViewCompanyModal({ isOpen, onClose, onEdit, company }: ViewCompanyModalProps) {
  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={`${company?.name || ''} — Details`}
      size="lg"
    >
      {company && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                ID
              </p>
              <p className="text-sm text-[var(--text-primary)] font-mono bg-[var(--bg-muted)] px-3 py-1.5 rounded-lg break-all">
                {company.id}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                Name
              </p>
              <p className="text-sm text-[var(--text-primary)]">{company.name}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                Industry
              </p>
              <p className="text-sm text-[var(--text-primary)]">
                {company.industry || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                Logo URL
              </p>
              <p className="text-sm text-[var(--text-primary)] break-all">
                {company.logo || '—'}
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
              Description
            </p>
            <p className="text-sm text-[var(--text-primary)]">
              {company.description || '—'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
              Interview Style
            </p>
            <p className="text-sm text-[var(--text-primary)]">
              {company.interviewStyle || '—'}
            </p>
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t border-[var(--border-color)]">
            <Button variant="secondary" size="sm" onClick={onEdit}>
              <PencilSquareIcon className="w-4 h-4" />
              Edit
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      )}
    </ModalShell>
  )
}

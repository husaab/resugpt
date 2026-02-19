'use client'

import { TrashIcon } from '@heroicons/react/24/outline'
import { ModalShell } from '@/components/ui/ModalShell'
import { Button } from '@/components/ui/button'
import type { CompanyListItem } from '@/types/interviewPrep'

interface DeleteCompanyModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  company: CompanyListItem | null
  isSubmitting: boolean
}

export function DeleteCompanyModal({ isOpen, onClose, onConfirm, company, isSubmitting }: DeleteCompanyModalProps) {
  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Delete Company">
      {company && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[var(--error-light)] flex items-center justify-center">
              <TrashIcon className="w-5 h-5 text-[var(--error)]" />
            </div>
            <div>
              <p className="font-medium text-[var(--text-primary)]">{company.name}</p>
              <p className="text-sm text-[var(--text-tertiary)]">
                This will also delete all roles for this company.
              </p>
            </div>
          </div>
          <p className="text-[var(--text-secondary)] mb-6">
            Are you sure you want to delete &quot;{company.name}&quot;? This action cannot be
            undone.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onConfirm} isLoading={isSubmitting}>
              Delete Company
            </Button>
          </div>
        </div>
      )}
    </ModalShell>
  )
}

'use client'

import { ModalShell } from '@/components/ui/ModalShell'
import { CompanyForm, type CompanyFormData } from './CompanyForm'
import type { CompanyListItem } from '@/types/interviewPrep'

interface EditCompanyModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CompanyFormData) => void
  company: CompanyListItem | null
  isSubmitting: boolean
}

export function EditCompanyModal({ isOpen, onClose, onSubmit, company, isSubmitting }: EditCompanyModalProps) {
  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit ${company?.name || ''}`}
      size="lg"
    >
      {company && (
        <CompanyForm
          key={company.id}
          initial={company}
          onSubmit={onSubmit}
          onCancel={onClose}
          isSubmitting={isSubmitting}
          submitLabel="Save Changes"
        />
      )}
    </ModalShell>
  )
}

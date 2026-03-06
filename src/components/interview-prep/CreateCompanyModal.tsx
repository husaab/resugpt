'use client'

import { ModalShell } from '@/components/ui/ModalShell'
import { CompanyForm, type CompanyFormData } from './CompanyForm'

interface CreateCompanyModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CompanyFormData) => void
  isSubmitting: boolean
}

export function CreateCompanyModal({ isOpen, onClose, onSubmit, isSubmitting }: CreateCompanyModalProps) {
  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Add Company" size="lg">
      <CompanyForm
        onSubmit={onSubmit}
        onCancel={onClose}
        isSubmitting={isSubmitting}
        submitLabel="Create Company"
      />
    </ModalShell>
  )
}

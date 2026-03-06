'use client'

import { ModalShell } from '@/components/ui/ModalShell'
import { RoleForm, type RoleFormData } from './RoleForm'

interface CreateRoleModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: RoleFormData) => void
  isSubmitting: boolean
}

export function CreateRoleModal({ isOpen, onClose, onSubmit, isSubmitting }: CreateRoleModalProps) {
  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Add Role" size="xl">
      <RoleForm
        onSubmit={onSubmit}
        onCancel={onClose}
        isSubmitting={isSubmitting}
        submitLabel="Create Role"
      />
    </ModalShell>
  )
}

'use client'

import { ModalShell } from '@/components/ui/ModalShell'
import { RoleForm, type RoleFormData } from './RoleForm'
import type { RoleDetails } from '@/types/interviewPrep'

interface EditRoleModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: RoleFormData) => void
  role: RoleDetails | null
  isSubmitting: boolean
}

export function EditRoleModal({ isOpen, onClose, onSubmit, role, isSubmitting }: EditRoleModalProps) {
  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={role ? `Edit ${role.title}` : 'Edit Role'}
      size="xl"
    >
      {role && (
        <RoleForm
          key={role.id}
          initial={role}
          onSubmit={onSubmit}
          onCancel={onClose}
          isSubmitting={isSubmitting}
          submitLabel="Save Changes"
        />
      )}
    </ModalShell>
  )
}

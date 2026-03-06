'use client'

import { TrashIcon } from '@heroicons/react/24/outline'
import { ModalShell } from '@/components/ui/ModalShell'
import { Button } from '@/components/ui/button'
import type { RoleSummary } from '@/types/interviewPrep'

interface DeleteRoleModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  role: RoleSummary | null
  isSubmitting: boolean
}

export function DeleteRoleModal({ isOpen, onClose, onConfirm, role, isSubmitting }: DeleteRoleModalProps) {
  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Delete Role">
      {role && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[var(--error-light)] flex items-center justify-center">
              <TrashIcon className="w-5 h-5 text-[var(--error)]" />
            </div>
            <div>
              <p className="font-medium text-[var(--text-primary)]">{role.title}</p>
              <p className="text-sm text-[var(--text-tertiary)]">
                This will permanently delete all rounds and questions.
              </p>
            </div>
          </div>
          <p className="text-[var(--text-secondary)] mb-6">
            Are you sure you want to delete &quot;{role.title}&quot;? This action cannot be
            undone.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onConfirm} isLoading={isSubmitting}>
              Delete Role
            </Button>
          </div>
        </div>
      )}
    </ModalShell>
  )
}

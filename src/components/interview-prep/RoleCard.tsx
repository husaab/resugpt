'use client'

import Link from 'next/link'
import {
  PencilSquareIcon,
  TrashIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline'
import { Badge } from '@/components/ui/badge'
import type { RoleSummary } from '@/types/interviewPrep'
import type { BadgeProps } from '@/components/ui/badge'

// ─── Badge variant mapping ──────────────────────────

const LEVEL_VARIANT: Record<RoleSummary['level'], BadgeProps['variant']> = {
  intern: 'default',
  junior: 'outline',
  mid: 'primary',
  senior: 'warning',
  staff: 'success',
}

// ─── Props ──────────────────────────────────────────

interface RoleCardProps {
  role: RoleSummary
  companyId: string
  isAdmin: boolean
  isSelected: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: (role: RoleSummary) => void
}

// ─── Component ──────────────────────────────────────

export function RoleCard({
  role,
  companyId,
  isAdmin,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: RoleCardProps) {
  return (
    <div
      onClick={onSelect}
      className={`h-full flex flex-col bg-[var(--bg-elevated)] border rounded-xl overflow-hidden transition-all cursor-pointer ${
        isSelected
          ? 'border-[var(--accent-color)] shadow-[0_0_0_1px_var(--accent-color),0_0_20px_-5px_var(--accent-color)]'
          : 'border-[var(--border-color)] hover:border-[var(--accent-color)] hover:shadow-[var(--shadow-md)]'
      }`}
    >
      <div className="p-5 flex-1 flex flex-col">
        {/* Title + level badge + admin buttons */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <h3 className="font-semibold text-[var(--text-primary)]">{role.title}</h3>
            <Badge variant={LEVEL_VARIANT[role.level]} size="sm">
              {role.level}
            </Badge>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <Link
              href={`/interview-prep/${companyId}/roles/${role.id}`}
              onClick={(e) => e.stopPropagation()}
              className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--accent-color)] hover:bg-[var(--accent-light)] transition-colors"
              title="View full details"
            >
              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
            </Link>
            {isAdmin && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit()
                  }}
                  className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--accent-color)] hover:bg-[var(--accent-light)] transition-colors"
                  title="Edit role"
                >
                  <PencilSquareIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(role)
                  }}
                  className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--error)] hover:bg-[var(--error-light)] transition-colors"
                  title="Delete role"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Department + description (takes remaining space) */}
        <div className="flex-1">
          {role.department && (
            <p className="text-xs text-[var(--text-tertiary)] mb-2 mt-1">{role.department}</p>
          )}
          {role.description && (
            <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-3">
              {role.description}
            </p>
          )}
        </div>

        {/* Round count badge (always at bottom) */}
        <div>
          <Badge variant="outline" size="sm">
            {role.roundCount} {role.roundCount === 1 ? 'round' : 'rounds'}
          </Badge>
        </div>
      </div>
    </div>
  )
}

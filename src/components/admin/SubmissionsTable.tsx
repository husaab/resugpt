'use client'

import { motion } from 'framer-motion'
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline'
import { Badge } from '@/components/ui/badge'
import type { SubmissionListItem, SubmissionStatus, SubmissionSource } from '@/types/interviewPrep'

interface SubmissionsTableProps {
  submissions: SubmissionListItem[]
  onRowClick: (submission: SubmissionListItem) => void
  isLoading: boolean
}

const statusBadgeVariant = (status: SubmissionStatus) => {
  const map = { pending: 'warning', approved: 'success', rejected: 'error' } as const
  return map[status]
}

const sourceBadgeVariant = (source: SubmissionSource) => {
  const map = { user: 'primary', scraper: 'outline' } as const
  return map[source]
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function SubmissionsTable({ submissions, onRowClick, isLoading }: SubmissionsTableProps) {
  if (isLoading) {
    return (
      <div className="border border-[var(--border-color)] rounded-xl overflow-hidden">
        <div className="animate-pulse">
          <div className="h-11 bg-[var(--bg-muted)]" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-[60px] border-t border-[var(--border-color)] bg-[var(--bg-elevated)]">
              <div className="flex items-center gap-6 px-6 py-4">
                <div className="h-4 w-28 bg-[var(--bg-muted)] rounded" />
                <div className="h-4 w-36 bg-[var(--bg-muted)] rounded" />
                <div className="h-4 w-14 bg-[var(--bg-muted)] rounded hidden sm:block" />
                <div className="h-5 w-18 bg-[var(--bg-muted)] rounded-full" />
                <div className="h-5 w-14 bg-[var(--bg-muted)] rounded-full hidden md:block" />
                <div className="h-4 w-24 bg-[var(--bg-muted)] rounded ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center py-16 border border-[var(--border-color)] rounded-xl bg-[var(--bg-elevated)]">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--bg-muted)] flex items-center justify-center">
          <ClipboardDocumentListIcon className="w-8 h-8 text-[var(--text-tertiary)]" />
        </div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">No submissions found</h3>
        <p className="text-sm text-[var(--text-secondary)]">Try adjusting your filters</p>
      </div>
    )
  }

  return (
    <div className="border border-[var(--border-color)] rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-[var(--bg-muted)] border-b border-[var(--border-color)]">
            <th className="text-left px-6 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Company</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Role</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider hidden sm:table-cell">Level</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Status</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider hidden md:table-cell">Source</th>
            <th className="text-right px-6 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Date</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((sub, index) => (
            <motion.tr
              key={sub.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.04 }}
              onClick={() => onRowClick(sub)}
              className="border-t border-[var(--border-color)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-muted)] cursor-pointer transition-colors"
            >
              <td className="px-6 py-3.5">
                <span className="font-medium text-[var(--text-primary)]">{sub.companyName}</span>
              </td>
              <td className="px-6 py-3.5 text-sm text-[var(--text-secondary)]">{sub.roleTitle}</td>
              <td className="px-6 py-3.5 text-sm text-[var(--text-secondary)] capitalize hidden sm:table-cell">{sub.roleLevel}</td>
              <td className="px-6 py-3.5">
                <Badge variant={statusBadgeVariant(sub.status)} size="sm">{sub.status}</Badge>
              </td>
              <td className="px-6 py-3.5 hidden md:table-cell">
                <Badge variant={sourceBadgeVariant(sub.source)} size="sm">{sub.source}</Badge>
              </td>
              <td className="px-6 py-3.5 text-right text-sm text-[var(--text-tertiary)]">
                {formatDate(sub.createdAt)}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

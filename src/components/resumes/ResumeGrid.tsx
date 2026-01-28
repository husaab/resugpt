'use client'

import { motion } from 'framer-motion'
import { ResumeCard } from './ResumeCard'
import { ResumeListItem } from '@/types/resume'
import { DocumentPlusIcon } from '@heroicons/react/24/outline'

interface ResumeGridProps {
  resumes: ResumeListItem[]
  onPreview: (id: string) => void
  onDownload: (id: string) => void
  onDelete: (id: string) => void
  emptyMessage?: string
  columns?: 'compact' | 'default'
}

export function ResumeGrid({
  resumes,
  onPreview,
  onDownload,
  onDelete,
  emptyMessage = "No resumes yet",
  columns = 'default'
}: ResumeGridProps) {
  if (resumes.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--bg-muted)] mb-4">
          <DocumentPlusIcon className="w-8 h-8 text-[var(--text-tertiary)]" />
        </div>
        <p className="text-[var(--text-secondary)] text-lg">{emptyMessage}</p>
        <p className="text-[var(--text-tertiary)] text-sm mt-1">
          Create your first resume to get started
        </p>
      </motion.div>
    )
  }

  // Compact mode uses 3 columns for the home page preview
  // Default mode uses responsive columns for the full resumes page
  const gridClass = columns === 'compact'
    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
    : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'

  return (
    <div className={gridClass}>
      {resumes.map((resume, index) => (
        <motion.div
          key={resume.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <ResumeCard
            id={resume.id}
            title={resume.title}
            targetRole={resume.targetRole}
            updatedAt={resume.updatedAt}
            thumbnailUrl={resume.thumbnailUrl}
            onPreview={onPreview}
            onDownload={onDownload}
            onDelete={onDelete}
          />
        </motion.div>
      ))}
    </div>
  )
}

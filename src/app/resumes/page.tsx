'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { MagnifyingGlassIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { ResumeGrid, PdfPreviewModal, DeleteConfirmModal } from '@/components/resumes'
import { listResumes, deleteResume } from '@/services/resumeService'
import { ResumeListItem } from '@/types/resume'
import { downloadPDF } from '@/lib/downloadUtils'

type SortOrder = 'newest' | 'oldest'

export default function ResumesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [resumes, setResumes] = useState<ResumeListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')
  const [showSortMenu, setShowSortMenu] = useState(false)

  const [previewResume, setPreviewResume] = useState<ResumeListItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ResumeListItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

  // Fetch resumes
  useEffect(() => {
    const fetchResumes = async () => {
      if (!session?.user?.googleId) return

      try {
        setIsLoading(true)
        const response = await listResumes(session.user.googleId)
        if (response.success) {
          setResumes(response.data)
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load resumes')
      } finally {
        setIsLoading(false)
      }
    }

    if (session?.user?.googleId) {
      fetchResumes()
    }
  }, [session?.user?.googleId])

  // Filter and sort resumes
  const filteredResumes = useMemo(() => {
    let result = [...resumes]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(query) ||
          r.targetCompany?.toLowerCase().includes(query) ||
          r.targetRole?.toLowerCase().includes(query)
      )
    }

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.updatedAt).getTime()
      const dateB = new Date(b.updatedAt).getTime()
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
    })

    return result
  }, [resumes, searchQuery, sortOrder])

  const handlePreview = (id: string) => {
    const resume = resumes.find((r) => r.id === id)
    if (resume) {
      setPreviewResume(resume)
    }
  }

  const handleDownload = async (id: string) => {
    const resume = resumes.find((r) => r.id === id)
    if (!resume?.pdfUrl) return

    try {
      await downloadPDF(resume.pdfUrl, `${resume.title}.pdf`)
    } catch (err) {
      console.error('Failed to download PDF:', err)
    }
  }

  const handleDeleteClick = (id: string) => {
    const resume = resumes.find((r) => r.id === id)
    if (resume) {
      setDeleteTarget(resume)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || !session?.user?.googleId) return

    try {
      setIsDeleting(true)
      await deleteResume(deleteTarget.id, session.user.googleId)
      setResumes((prev) => prev.filter((r) => r.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err: any) {
      setError(err.message || 'Failed to delete resume')
    } finally {
      setIsDeleting(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-10 w-48 bg-[var(--bg-muted)] rounded-lg mb-8" />
            <div className="flex gap-3 mb-8">
              <div className="h-12 w-80 bg-[var(--bg-muted)] rounded-xl" />
              <div className="h-12 w-32 bg-[var(--bg-muted)] rounded-xl" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden">
                  <div className="aspect-[8.5/11] bg-[var(--bg-muted)]" />
                  <div className="p-4 space-y-3 bg-[var(--bg-elevated)]">
                    <div className="h-5 w-3/4 bg-[var(--bg-muted)] rounded" />
                    <div className="h-4 w-1/2 bg-[var(--bg-muted)] rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-6">
            Your Resumes
          </h1>

          {/* Search and Sort */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title or company..."
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]/50"
              />
            </div>

            {/* Sort */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors"
              >
                Sort: {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
                <ChevronDownIcon className="w-4 h-4" />
              </button>

              {showSortMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowSortMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 top-12 z-20 w-36 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl shadow-lg overflow-hidden"
                  >
                    <button
                      onClick={() => {
                        setSortOrder('newest')
                        setShowSortMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors"
                    >
                      Newest first
                    </button>
                    <button
                      onClick={() => {
                        setSortOrder('oldest')
                        setShowSortMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors"
                    >
                      Oldest first
                    </button>
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-[var(--error-light)] border border-[var(--error)] rounded-xl">
            <p className="text-sm text-[var(--error)]">{error}</p>
          </div>
        )}

        {/* Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <ResumeGrid
            resumes={filteredResumes}
            onPreview={handlePreview}
            onDownload={handleDownload}
            onDelete={handleDeleteClick}
            emptyMessage={
              searchQuery
                ? 'No resumes match your search'
                : 'No resumes yet. Create your first one!'
            }
          />
        </motion.div>
      </div>

      {/* Preview Modal */}
      <PdfPreviewModal
        isOpen={!!previewResume}
        onClose={() => setPreviewResume(null)}
        pdfUrl={previewResume?.pdfUrl || null}
        title={previewResume?.title || ''}
        onDownload={() => previewResume && handleDownload(previewResume.id)}
      />

      {/* Delete Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={deleteTarget?.title || ''}
        isDeleting={isDeleting}
      />
    </div>
  )
}

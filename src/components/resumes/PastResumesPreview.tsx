'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRightIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { ResumeGrid, PdfPreviewModal, DeleteConfirmModal } from '@/components/resumes'
import { listResumes, deleteResume } from '@/services/resumeService'
import { ResumeListItem } from '@/types/resume'

export function PastResumesPreview() {
  const { data: session } = useSession()
  const [resumes, setResumes] = useState<ResumeListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [previewResume, setPreviewResume] = useState<ResumeListItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ResumeListItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const fetchResumes = async () => {
      if (!session?.user?.googleId) return

      try {
        setIsLoading(true)
        const response = await listResumes(session.user.googleId)
        if (response.success) {
          // Only show first 3
          setResumes(response.data.slice(0, 3))
        }
      } catch (err) {
        console.error('Failed to load resumes:', err)
      } finally {
        setIsLoading(false)
      }
    }

    if (session?.user?.googleId) {
      fetchResumes()
    }
  }, [session?.user?.googleId])

  const handlePreview = (id: string) => {
    const resume = resumes.find((r) => r.id === id)
    if (resume) setPreviewResume(resume)
  }

  const handleDownload = async (id: string) => {
    const resume = resumes.find((r) => r.id === id)
    if (!resume?.pdfUrl) return

    try {
      // Fetch the PDF as a blob to bypass cross-origin download restrictions
      const response = await fetch(resume.pdfUrl)
      const blob = await response.blob()

      // Create a blob URL and trigger download
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `${resume.title}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      // Clean up the blob URL
      URL.revokeObjectURL(blobUrl)
    } catch (err) {
      console.error('Failed to download PDF:', err)
      // Fallback: open in new tab if fetch fails
      window.open(resume.pdfUrl, '_blank')
    }
  }

  const handleDeleteClick = (id: string) => {
    const resume = resumes.find((r) => r.id === id)
    if (resume) setDeleteTarget(resume)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || !session?.user?.googleId) return

    try {
      setIsDeleting(true)
      await deleteResume(deleteTarget.id, session.user.googleId)
      setResumes((prev) => prev.filter((r) => r.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      console.error('Failed to delete:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  // Don't render if not logged in or no resumes
  if (!session?.user || (!isLoading && resumes.length === 0)) {
    return null
  }

  if (isLoading) {
    return (
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="flex items-center justify-between mb-8">
              <div className="h-8 w-48 bg-[var(--bg-muted)] rounded-lg" />
              <div className="h-6 w-24 bg-[var(--bg-muted)] rounded-lg" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
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
      </section>
    )
  }

  return (
    <>
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[var(--accent-color)]/10">
                  <DocumentTextIcon className="w-6 h-6 text-[var(--accent-color)]" />
                </div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                  Your Resumes
                </h2>
              </div>
              <Link
                href="/resumes"
                className="group flex items-center gap-2 text-sm font-medium text-[var(--accent-color)] hover:underline underline-offset-4"
              >
                View all
                <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Grid - full width with compact mode (3 columns max) */}
            <ResumeGrid
              resumes={resumes}
              onPreview={handlePreview}
              onDownload={handleDownload}
              onDelete={handleDeleteClick}
              columns="compact"
            />
          </motion.div>
        </div>
      </section>

      {/* Modals */}
      <PdfPreviewModal
        isOpen={!!previewResume}
        onClose={() => setPreviewResume(null)}
        pdfUrl={previewResume?.pdfUrl || null}
        title={previewResume?.title || ''}
        onDownload={() => previewResume && handleDownload(previewResume.id)}
      />

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={deleteTarget?.title || ''}
        isDeleting={isDeleting}
      />
    </>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BackgroundGradient } from '@/components/shared/background-gradient'
import { Button } from '@/components/ui/button'
import { listCoverLetters, deleteCoverLetter, getCoverLetter, compileCoverLetter } from '@/services/coverLetterService'
import { CoverLetterListItem } from '@/types/coverLetter'
import { PencilIcon, TrashIcon, PlusIcon, DocumentTextIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'

export default function CoverLettersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [coverLetters, setCoverLetters] = useState<CoverLetterListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  // Redirect unauthenticated users
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth')
    }
  }, [status, router])

  // Load cover letters
  useEffect(() => {
    const loadCoverLetters = async () => {
      if (!session?.user?.googleId) return

      try {
        setIsLoading(true)
        setError(null)
        const response = await listCoverLetters(session.user.googleId)

        if (response.success) {
          setCoverLetters(response.data)
        }
      } catch (err: any) {
        console.error('Failed to load cover letters:', err)
        setError(err.message || 'Failed to load cover letters')
      } finally {
        setIsLoading(false)
      }
    }

    if (status === 'authenticated') {
      loadCoverLetters()
    }
  }, [session?.user?.googleId, status])

  const handleDelete = async (id: string) => {
    if (!session?.user?.googleId) return

    const confirmed = window.confirm(
      'Are you sure you want to delete this cover letter? This action cannot be undone.'
    )
    if (!confirmed) return

    try {
      setDeletingId(id)
      await deleteCoverLetter(id, session.user.googleId)
      setCoverLetters((prev) => prev.filter((cl) => cl.id !== id))
    } catch (err: any) {
      console.error('Failed to delete cover letter:', err)
      setError(err.message || 'Failed to delete cover letter')
    } finally {
      setDeletingId(null)
    }
  }

  const handleDownload = async (id: string, jobTitle: string, companyName?: string) => {
    if (!session?.user?.googleId) return

    try {
      setDownloadingId(id)

      // Fetch the cover letter content
      const response = await getCoverLetter(id, session.user.googleId)
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch cover letter')
      }

      // Compile to PDF
      const pdfBlob = await compileCoverLetter(response.data.content)

      // Trigger download
      const url = URL.createObjectURL(pdfBlob)
      const fileName = companyName
        ? `Cover Letter - ${companyName} - ${jobTitle}.pdf`
        : `Cover Letter - ${jobTitle}.pdf`

      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err: any) {
      console.error('Failed to download cover letter:', err)
      setError(err.message || 'Failed to download cover letter')
    } finally {
      setDownloadingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <BackgroundGradient />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 rounded-lg bg-[var(--bg-muted)]" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-2xl bg-[var(--bg-muted)]" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <BackgroundGradient />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
        >
          <div>
            <h1
              className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              Cover Letters
            </h1>
            <p className="text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>
              Manage your generated cover letters
            </p>
          </div>

          <Link href="/cover-letter" className="shrink-0">
            <Button variant="primary" size="md" className="w-full sm:w-auto justify-center">
              <PlusIcon className="w-5 h-5" />
              New Cover Letter
            </Button>
          </Link>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl border border-[var(--error)]/30 bg-[var(--error-light)]"
          >
            <p className="text-sm" style={{ color: 'var(--error)' }}>
              {error}
            </p>
          </motion.div>
        )}

        {/* Cover Letters List */}
        {coverLetters.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-xl sm:rounded-2xl border p-8 sm:p-12 text-center"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-color)',
            }}
          >
            <DocumentTextIcon
              className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4"
              style={{ color: 'var(--text-tertiary)' }}
            />
            <h3
              className="text-base sm:text-lg font-semibold mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              No cover letters yet
            </h3>
            <p
              className="text-sm mb-5 sm:mb-6 max-w-xs mx-auto"
              style={{ color: 'var(--text-secondary)' }}
            >
              Create your first AI-generated cover letter to get started
            </p>
            <Link href="/cover-letter">
              <Button variant="primary" size="md" className="w-full sm:w-auto justify-center">
                <PlusIcon className="w-5 h-5" />
                Create Cover Letter
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {coverLetters.map((coverLetter, index) => (
              <motion.div
                key={coverLetter.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="rounded-xl sm:rounded-2xl border p-4 sm:p-6"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-color)',
                }}
              >
                {/* Desktop layout */}
                <div className="hidden sm:flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-lg font-semibold truncate"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {coverLetter.jobTitle}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      {coverLetter.companyName && (
                        <span
                          className="text-sm"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {coverLetter.companyName}
                        </span>
                      )}
                      <span
                        className="text-sm"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        Created {formatDate(coverLetter.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Link href={`/cover-letter-editor/${coverLetter.id}`}>
                      <Button variant="secondary" size="sm">
                        <PencilIcon className="w-4 h-4" />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDownload(coverLetter.id, coverLetter.jobTitle, coverLetter.companyName)}
                      disabled={downloadingId === coverLetter.id}
                    >
                      {downloadingId === coverLetter.id ? (
                        <div className="w-4 h-4 border-2 border-[var(--accent-color)] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <ArrowDownTrayIcon className="w-4 h-4" />
                      )}
                      Download
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(coverLetter.id)}
                      disabled={deletingId === coverLetter.id}
                      className="text-[var(--error)] hover:bg-[var(--error-light)]"
                    >
                      {deletingId === coverLetter.id ? (
                        <div className="w-4 h-4 border-2 border-[var(--error)] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <TrashIcon className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Mobile layout */}
                <div className="sm:hidden">
                  {/* Title and metadata */}
                  <div className="mb-3">
                    <h3
                      className="text-base font-semibold line-clamp-2"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {coverLetter.jobTitle}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                      {coverLetter.companyName && (
                        <span
                          className="text-sm"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {coverLetter.companyName}
                        </span>
                      )}
                      {coverLetter.companyName && (
                        <span className="text-[var(--text-tertiary)]">•</span>
                      )}
                      <span
                        className="text-xs"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        {formatDate(coverLetter.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    <Link href={`/cover-letter-editor/${coverLetter.id}`} className="flex-1">
                      <Button variant="secondary" size="sm" className="w-full justify-center">
                        <PencilIcon className="w-4 h-4" />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDownload(coverLetter.id, coverLetter.jobTitle, coverLetter.companyName)}
                      disabled={downloadingId === coverLetter.id}
                      className="flex-1 justify-center"
                    >
                      {downloadingId === coverLetter.id ? (
                        <div className="w-4 h-4 border-2 border-[var(--accent-color)] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <ArrowDownTrayIcon className="w-4 h-4" />
                      )}
                      <span>Download</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(coverLetter.id)}
                      disabled={deletingId === coverLetter.id}
                      className="text-[var(--error)] hover:bg-[var(--error-light)] !px-2.5"
                    >
                      {deletingId === coverLetter.id ? (
                        <div className="w-4 h-4 border-2 border-[var(--error)] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <TrashIcon className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeftIcon, BookmarkIcon, DocumentTextIcon, EyeIcon, ArrowPathIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { TextEditor, CoverLetterPreviewPanel } from '@/components/cover-letter-editor'
import { getCoverLetter, saveCoverLetter, compileCoverLetter } from '@/services/coverLetterService'
import { cn } from '@/lib/utils'
import { downloadPDF } from '@/lib/downloadUtils'

type MobileView = 'editor' | 'preview'

export default function CoverLetterEditorPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const coverLetterId = params.id as string

  const [content, setContent] = useState<string>('')
  const [jobTitle, setJobTitle] = useState<string>('')
  const [companyName, setCompanyName] = useState<string>('')

  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isCompiling, setIsCompiling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [compileError, setCompileError] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Mobile view state - default to preview so users see their cover letter first
  const [mobileView, setMobileView] = useState<MobileView>('preview')

  // Load cover letter data and auto-generate PDF
  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.push('/')
      return
    }

    const loadCoverLetter = async () => {
      if (!session?.user?.googleId) return

      try {
        setIsLoading(true)
        setError(null)
        const response = await getCoverLetter(coverLetterId, session.user.googleId)

        if (response.success && response.data) {
          setContent(response.data.content)
          setJobTitle(response.data.jobTitle)
          setCompanyName(response.data.companyName || '')

          // Auto-generate PDF preview on load
          try {
            setIsCompiling(true)
            const pdfBlob = await compileCoverLetter(response.data.content)
            const url = URL.createObjectURL(pdfBlob)
            setPdfUrl(url)
          } catch (pdfErr: any) {
            console.error('Failed to auto-generate PDF:', pdfErr)
            setCompileError(pdfErr.message || 'Failed to generate PDF preview')
          } finally {
            setIsCompiling(false)
          }
        }
      } catch (err: any) {
        console.error('Failed to load cover letter:', err)
        setError(err.message || 'Failed to load cover letter')
      } finally {
        setIsLoading(false)
      }
    }

    loadCoverLetter()
  }, [coverLetterId, session?.user?.googleId, status, router])

  // Track unsaved changes
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent)
    setHasUnsavedChanges(true)
  }, [])

  // Save cover letter
  const handleSave = async () => {
    if (!session?.user?.googleId) return

    try {
      setIsSaving(true)
      setError(null)

      await saveCoverLetter({
        id: coverLetterId,
        content,
        googleId: session.user.googleId,
      })

      setHasUnsavedChanges(false)
    } catch (err: any) {
      console.error('Failed to save cover letter:', err)
      setError(err.message || 'Failed to save cover letter')
    } finally {
      setIsSaving(false)
    }
  }

  // Compile PDF
  const handleCompile = async () => {
    if (!content) return

    try {
      setIsCompiling(true)
      setCompileError(null)

      // Revoke previous PDF URL to prevent memory leaks
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }

      const pdfBlob = await compileCoverLetter(content)
      const url = URL.createObjectURL(pdfBlob)
      setPdfUrl(url)
    } catch (err: any) {
      console.error('Failed to compile PDF:', err)
      setCompileError(err.message || 'Failed to compile PDF')
    } finally {
      setIsCompiling(false)
    }
  }

  // Download PDF
  const handleDownload = () => {
    if (!pdfUrl) return
    const fileName = companyName
      ? `Cover Letter - ${companyName} - ${jobTitle}.pdf`
      : `Cover Letter - ${jobTitle}.pdf`
    downloadPDF(pdfUrl, fileName)
  }

  // Cleanup PDF URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }
    }
  }, [pdfUrl])

  // Warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  // Handle back navigation with unsaved changes guard
  const handleBack = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave? Your changes will be lost.'
      )
      if (!confirmed) return
    }
    router.push('/cover-letters')
  }

  // Build display title
  const displayTitle = companyName
    ? `${jobTitle} at ${companyName}`
    : jobTitle || 'Untitled Cover Letter'

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center bg-[var(--bg-body)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-[var(--accent-color)] border-t-transparent rounded-full animate-spin" />
          <p className="text-[var(--text-secondary)]">Loading editor...</p>
        </div>
      </div>
    )
  }

  if (error && !content) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center bg-[var(--bg-body)]">
        <div className="text-center">
          <p className="text-[var(--error)] mb-4">{error}</p>
          <Button variant="secondary" onClick={() => router.push('/cover-letters')}>
            Go to Cover Letters
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-16 bg-[var(--bg-body)] flex flex-col">
      {/* Header */}
      <header className="sticky top-16 z-40 border-b border-[var(--border-color)] bg-[var(--bg-elevated)]">
        {/* Desktop header */}
        <div className="hidden md:flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back
            </Button>

            <div className="h-6 w-px bg-[var(--border-color)]" />

            <h1 className="font-semibold text-[var(--text-primary)] truncate max-w-[300px]">
              {displayTitle}
            </h1>

            {hasUnsavedChanges && (
              <span className="text-xs text-[var(--text-tertiary)]">• Unsaved changes</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSave}
              isLoading={isSaving}
              disabled={isSaving || !hasUnsavedChanges}
            >
              <BookmarkIcon className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        {/* Mobile header */}
        <div className="md:hidden">
          {/* Top row: Back, title, save */}
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="shrink-0 !px-2"
              >
                <ArrowLeftIcon className="w-4 h-4" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="font-semibold text-[var(--text-primary)] truncate text-sm">
                  {displayTitle}
                </h1>
                {hasUnsavedChanges && (
                  <span className="text-[10px] text-[var(--text-tertiary)]">Unsaved changes</span>
                )}
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSave}
              isLoading={isSaving}
              disabled={isSaving || !hasUnsavedChanges}
              className="shrink-0 !px-3"
            >
              <BookmarkIcon className="w-4 h-4" />
              <span className="hidden xs:inline">{isSaving ? 'Saving...' : 'Save'}</span>
            </Button>
          </div>

          {/* Bottom row: View toggle */}
          <div className="flex items-center justify-center px-3 pb-2">
            <div className="flex items-center bg-[var(--bg-muted)] rounded-lg p-0.5">
              <button
                onClick={() => setMobileView('editor')}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-1.5 text-xs rounded-md transition-colors',
                  mobileView === 'editor'
                    ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)]'
                )}
              >
                <DocumentTextIcon className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                onClick={() => setMobileView('preview')}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-1.5 text-xs rounded-md transition-colors',
                  mobileView === 'preview'
                    ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)]'
                )}
              >
                <EyeIcon className="w-3.5 h-3.5" />
                Preview
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="px-4 py-2 bg-[var(--error-light)] border-t border-[var(--error)]">
            <p className="text-sm text-[var(--error)]">{error}</p>
          </div>
        )}
      </header>

      {/* Main Content - Desktop */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {/* Editor Panel - scrollable */}
        <div className="w-1/2 h-[calc(100vh-120px)] border-r border-[var(--border-color)] overflow-y-auto">
          <div className="p-4">
            <TextEditor
              content={content}
              onChange={handleContentChange}
            />
          </div>
        </div>

        {/* Preview Panel - fixed on right */}
        <div className="w-1/2 h-[calc(100vh-120px)] p-4">
          <CoverLetterPreviewPanel
            pdfUrl={pdfUrl}
            isCompiling={isCompiling}
            onCompile={handleCompile}
            onDownload={handleDownload}
            error={compileError}
          />
        </div>
      </div>

      {/* Main Content - Mobile */}
      <div className="md:hidden">
        <AnimatePresence mode="wait">
          {mobileView === 'editor' ? (
            <motion.div
              key="editor"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-[calc(100vh-136px)] overflow-y-auto"
            >
              <div className="p-3 pb-24">
                <TextEditor
                  content={content}
                  onChange={handleContentChange}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="h-[calc(100vh-136px)] p-3 pb-20"
            >
              <div className="h-full">
                <CoverLetterPreviewPanel
                  pdfUrl={pdfUrl}
                  isCompiling={isCompiling}
                  onCompile={handleCompile}
                  onDownload={handleDownload}
                  error={compileError}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile floating action buttons */}
        <div className="fixed bottom-4 left-0 right-0 flex justify-center gap-3 z-50 px-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleCompile}
            disabled={isCompiling}
            className={cn(
              'flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-colors',
              'bg-[var(--bg-elevated)] border border-[var(--border-color)]',
              'text-[var(--text-primary)]',
              isCompiling && 'opacity-70'
            )}
          >
            <ArrowPathIcon className={cn('w-5 h-5', isCompiling && 'animate-spin')} />
            <span className="text-sm font-medium">{isCompiling ? 'Generating...' : 'Generate'}</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleDownload}
            disabled={!pdfUrl || isCompiling}
            className={cn(
              'flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-colors',
              'bg-[var(--accent-color)] text-white',
              (!pdfUrl || isCompiling) && 'opacity-50'
            )}
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Download</span>
          </motion.button>
        </div>
      </div>
    </div>
  )
}

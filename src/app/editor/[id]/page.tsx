'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { ArrowLeftIcon, BookmarkIcon, CodeBracketIcon, Squares2X2Icon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { StructuredEditor, PreviewPanel, AdvancedEditor } from '@/components/editor'
import { getResume, saveResume, compileResume } from '@/services/resumeService'
import { ResumeData } from '@/types/resume'
import { cn } from '@/lib/utils'

type EditorMode = 'structured' | 'advanced'

// Function to generate LaTeX from resume data (client-side mirror of backend)
function generateLatexFromData(data: ResumeData): string {
  // This is a simplified version - the backend has the full implementation
  // For now, we'll rely on the latex from the server and only use this for new changes
  return `% Resume generated from structured data
% Full LaTeX generation happens on the server
% Edit in structured mode or compile to see changes
`
}

export default function EditorPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const resumeId = params.id as string

  const [resumeData, setResumeData] = useState<ResumeData | null>(null)
  const [latex, setLatex] = useState<string>('')
  const [jobDescription, setJobDescription] = useState<string>('')
  const [title, setTitle] = useState<string>('')

  const [editorMode, setEditorMode] = useState<EditorMode>('structured')
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isCompiling, setIsCompiling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [compileError, setCompileError] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Track if we've already auto-compiled and if resume needs thumbnail generation
  const [hasAutoCompiled, setHasAutoCompiled] = useState(false)
  const [needsThumbnail, setNeedsThumbnail] = useState(false)

  // Load resume data
  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.push('/')
      return
    }

    const loadResume = async () => {
      if (!session?.user?.googleId) return

      try {
        setIsLoading(true)
        setError(null)
        const response = await getResume(resumeId, session.user.googleId)

        if (response.success && response.data) {
          setResumeData(response.data.resumeData)
          setLatex(response.data.latex)
          setJobDescription(response.data.jobDescription || '')
          setTitle(response.data.title || 'Untitled Resume')
          // Check if resume needs thumbnail generation (no pdfPath means it was never saved with PDF)
          setNeedsThumbnail(!response.data.pdfPath)
        }
      } catch (err: any) {
        console.error('Failed to load resume:', err)
        setError(err.message || 'Failed to load resume')
      } finally {
        setIsLoading(false)
      }
    }

    loadResume()
  }, [resumeId, session?.user?.googleId, status, router])

  // Auto-compile PDF when resume data loads, and auto-save if thumbnail is missing
  useEffect(() => {
    const autoCompileAndSave = async () => {
      if (!isLoading && resumeData && latex && !hasAutoCompiled && !pdfUrl) {
        setHasAutoCompiled(true)

        try {
          setIsCompiling(true)
          setCompileError(null)

          // Compile PDF for preview
          const pdfBlob = await compileResume({ resumeData })
          const url = URL.createObjectURL(pdfBlob)
          setPdfUrl(url)

          // If resume needs thumbnail, auto-save to generate it on backend
          if (needsThumbnail && session?.user?.googleId) {
            console.log('Auto-saving to generate thumbnail...')
            try {
              await saveResume({
                id: resumeId,
                resumeData,
                latex,
                jobDescription,
                googleId: session.user.googleId,
              })
              setNeedsThumbnail(false)
              console.log('Auto-save complete - thumbnail should be generated')
            } catch (saveErr) {
              console.error('Auto-save failed:', saveErr)
            }
          }
        } catch (err: any) {
          console.error('Auto-compile failed:', err)
          setCompileError(err.message || 'Failed to compile PDF')
        } finally {
          setIsCompiling(false)
        }
      }
    }

    autoCompileAndSave()
  }, [isLoading, resumeData, latex, hasAutoCompiled, pdfUrl, needsThumbnail, session?.user?.googleId, resumeId, jobDescription])

  // Track unsaved changes
  const handleResumeDataChange = useCallback((data: ResumeData) => {
    setResumeData(data)
    setHasUnsavedChanges(true)
  }, [])

  const handleLatexChange = useCallback((newLatex: string) => {
    setLatex(newLatex)
    setHasUnsavedChanges(true)
  }, [])

  // Save resume
  const handleSave = async () => {
    if (!resumeData || !session?.user?.googleId) return

    try {
      setIsSaving(true)
      setError(null)

      await saveResume({
        id: resumeId,
        resumeData,
        latex,
        jobDescription,
        googleId: session.user.googleId,
      })

      setHasUnsavedChanges(false)
    } catch (err: any) {
      console.error('Failed to save resume:', err)
      setError(err.message || 'Failed to save resume')
    } finally {
      setIsSaving(false)
    }
  }

  // Compile PDF
  const handleCompile = async () => {
    if (!resumeData && !latex) return

    try {
      setIsCompiling(true)
      setCompileError(null)

      // Revoke previous PDF URL to prevent memory leaks
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }

      // Send resumeData if in structured mode, otherwise send latex
      // This ensures edits in structured mode are reflected in the PDF
      const pdfBlob = await compileResume(
        editorMode === 'structured' && resumeData
          ? { resumeData }
          : { latex }
      )
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

    const a = document.createElement('a')
    a.href = pdfUrl
    a.download = `${title || 'resume'}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
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
    router.push('/')
  }

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

  if (error && !resumeData) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center bg-[var(--bg-body)]">
        <div className="text-center">
          <p className="text-[var(--error)] mb-4">{error}</p>
          <Button variant="secondary" onClick={() => router.push('/')}>
            Go Back Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-16 bg-[var(--bg-body)] flex flex-col">
      {/* Header */}
      <header className="sticky top-16 z-40 border-b border-[var(--border-color)] bg-[var(--bg-elevated)]">
        <div className="flex items-center justify-between px-4 py-3">
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
              {title}
            </h1>

            {hasUnsavedChanges && (
              <span className="text-xs text-[var(--text-tertiary)]">• Unsaved changes</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Editor Mode Toggle */}
            <div className="flex items-center bg-[var(--bg-muted)] rounded-lg p-1">
              <button
                onClick={() => setEditorMode('structured')}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors',
                  editorMode === 'structured'
                    ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                )}
              >
                <Squares2X2Icon className="w-4 h-4" />
                Structured
              </button>
              <button
                onClick={() => setEditorMode('advanced')}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors',
                  editorMode === 'advanced'
                    ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                )}
              >
                <CodeBracketIcon className="w-4 h-4" />
                Advanced
              </button>
            </div>

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

        {error && (
          <div className="px-4 py-2 bg-[var(--error-light)] border-t border-[var(--error)]">
            <p className="text-sm text-[var(--error)]">{error}</p>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Panel - scrollable */}
        <div className="w-1/2 h-[calc(100vh-120px)] border-r border-[var(--border-color)] overflow-y-auto">
          <div className="p-4">
            {editorMode === 'structured' && resumeData ? (
              <StructuredEditor
                resumeData={resumeData}
                onChange={handleResumeDataChange}
              />
            ) : (
              <AdvancedEditor
                latex={latex}
                onChange={handleLatexChange}
              />
            )}
          </div>
        </div>

        {/* Preview Panel - fixed on right */}
        <div className="w-1/2 h-[calc(100vh-120px)] p-4">
          <PreviewPanel
            pdfUrl={pdfUrl}
            isCompiling={isCompiling}
            onCompile={handleCompile}
            onDownload={handleDownload}
            error={compileError}
          />
        </div>
      </div>
    </div>
  )
}

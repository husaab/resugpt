'use client'

import { useState, useEffect, useRef, ChangeEvent, DragEvent } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { FadeIn } from './motion/fade-in'
import { cn } from '@/lib/utils'
import { LoginModal } from './auth/LoginModal'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { useApplicationQAFormPersistence } from '@/hooks/useApplicationQAFormPersistence'
import { useCredits } from '@/contexts/CreditContext'
import { generateQASession } from '@/services/applicationQAService'
import { CreditWarningBanner } from './credits/CreditWarningBanner'
import { Tooltip } from './ui/Tooltip'
import { ValidationTooltipContent } from './ui/ValidationTooltipContent'

// Dynamic import for pdfjs to avoid SSR issues
let pdfjsLib: any = null

interface QuestionField {
  question: string
  wordLimit?: number | null
}

interface FormData {
  resumeText: string | null
  questions: QuestionField[]
}

export function ApplicationQAForm() {
  const router = useRouter()
  const [isPdfReady, setIsPdfReady] = useState<boolean>(false)
  const [pdfFileName, setPdfFileName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auth guard and form persistence hooks
  const authGuard = useAuthGuard()
  const { saveFormData, getFormData, clearFormData } = useApplicationQAFormPersistence()

  // Shared credit state (updates navbar instantly)
  const { displayCredits, subscriptionStatus, canGenerate, decrementCredits, refreshCredits } = useCredits()

  useEffect(() => {
    const loadPdfJs = async () => {
      try {
        pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url
        ).toString()
      } catch (error) {
        console.error('Failed to load PDF.js:', error)
        try {
          if (pdfjsLib) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
          }
        } catch (fallbackError) {
          console.error('Fallback worker also failed:', fallbackError)
        }
      }
    }
    loadPdfJs()
  }, [])

  const {
    handleSubmit,
    register,
    setValue,
    control,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<FormData>({
    defaultValues: {
      resumeText: null,
      questions: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'questions',
  })

  // Restore form state from localStorage after successful login
  useEffect(() => {
    if (authGuard.isAuthenticated) {
      const savedData = getFormData()
      if (savedData) {
        // Restore form values silently
        if (savedData.resumeText) {
          setValue('resumeText', savedData.resumeText)
          setIsPdfReady(true)
        }
        if (savedData.pdfFileName) {
          setPdfFileName(savedData.pdfFileName)
        }
        if (savedData.questions && savedData.questions.length > 0) {
          savedData.questions.forEach((q) => {
            append({ question: q.question, wordLimit: q.wordLimit })
          })
        }
        // Clear localStorage after restoration
        clearFormData()
      }
    }
  }, [authGuard.isAuthenticated, getFormData, setValue, clearFormData, append])

  const questions = watch('questions')

  const handleFileButtonClick = () => {
    fileInputRef.current?.click()
  }

  const processFile = async (file: File) => {
    if (!pdfjsLib) {
      alert('PDF processing is still loading. Please try again in a moment.')
      return
    }

    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file.')
      return
    }

    setValue('resumeText', null)
    setIsPdfReady(false)
    setPdfFileName(null)
    setIsLoading(true)

    setPdfFileName(file.name)

    const fileReader = new FileReader()

    fileReader.onload = function () {
      if (this.result == null || !(this.result instanceof ArrayBuffer)) {
        setIsLoading(false)
        return
      }
      const typedarray = new Uint8Array(this.result)

      const loadingTask = pdfjsLib.getDocument(typedarray)
      let textBuilder = ''

      loadingTask.promise
        .then(async (pdf: any) => {
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i)
            const content = await page.getTextContent()
            const text = content.items
              .map((item: any) => {
                if (item.str) {
                  return item.str
                }
                return ''
              })
              .join(' ')
            textBuilder += text
          }
          setIsPdfReady(true)
          setValue('resumeText', textBuilder)
          setIsLoading(false)
        })
        .catch((err: any) => {
          alert('An error occurred uploading your PDF. Please try again.')
          console.error(err)
          setIsLoading(false)
        })
    }

    try {
      fileReader.readAsArrayBuffer(file)
    } catch (error) {
      alert('An error occurred uploading your PDF. Please try again.')
      setIsLoading(false)
    }
  }

  async function onFileUpload(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files == null || event.target.files.length === 0) return
    await processFile(event.target.files[0])
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      await processFile(files[0])
    }
  }

  const onSubmit = async (data: FormData) => {
    // Check if user is authenticated
    if (!authGuard.isAuthenticated) {
      // Save form state to localStorage before showing login modal
      saveFormData({
        resumeText: data.resumeText,
        pdfFileName: pdfFileName,
        questions: data.questions.map((q) => ({
          question: q.question,
          wordLimit: q.wordLimit || undefined,
        })),
      })
      // Show login modal
      authGuard.setShowLoginModal(true)
      return
    }

    // Clear any previous errors
    setSubmitError(null)

    // Get user's Google ID from session
    const googleId = authGuard.session?.user?.googleId
    if (!googleId) {
      setSubmitError('Session error. Please try logging in again.')
      return
    }

    // Check credits
    if (!canGenerate) {
      setSubmitError('You have no credits remaining. Please upgrade your plan to continue.')
      return
    }

    // Optimistic credit decrement for immediate UI feedback (updates navbar too)
    decrementCredits()

    try {
      // Prepare questions for API (filter out empty ones)
      const validQuestions = data.questions
        .filter((q) => q.question.trim().length > 0)
        .map((q) => ({
          question: q.question.trim(),
          wordLimit: q.wordLimit || undefined,
        }))

      // Call the generate API
      const response = await generateQASession({
        resumeText: data.resumeText || '',
        questions: validQuestions,
        googleId,
      })

      if (response.success && response.data?.id) {
        // Refresh session to sync credits with backend (clears optimistic state)
        await refreshCredits()
        // Clear form persistence data
        clearFormData()
        // Redirect to the editor
        router.push(`/application-qa/${response.data.id}`)
      } else {
        // Revert optimistic update and re-sync with backend
        await refreshCredits()
        setSubmitError(response.message || 'Failed to generate Q&A session. Please try again.')
      }
    } catch (error: any) {
      console.error('Q&A generation error:', error)
      // Revert optimistic update and re-sync with backend
      await refreshCredits()
      setSubmitError(error.message || 'An unexpected error occurred. Please try again.')
    }
  }

  const removeFile = () => {
    setValue('resumeText', null)
    setIsPdfReady(false)
    setPdfFileName(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const addQuestion = () => {
    append({ question: '', wordLimit: null })
  }

  // Get list of missing requirements for tooltip
  const getMissingRequirements = (): string[] => {
    const missing: string[] = []
    if (!isPdfReady) {
      missing.push('Upload your resume (PDF)')
    }
    return missing
  }

  const missingRequirements = getMissingRequirements()
  const showValidationTooltip = missingRequirements.length > 0 && !isSubmitting && !(authGuard.isAuthenticated && !canGenerate)

  return (
    <FadeIn delay={0.2}>
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6 md:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* PDF Upload Zone */}
            <div className="space-y-3">
              <label
                className="block text-sm font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                Resume (PDF)
              </label>

              <input
                id="resumeText"
                type="file"
                accept="application/pdf"
                onChange={onFileUpload}
                className="hidden"
                ref={fileInputRef}
              />

              <AnimatePresence mode="wait">
                {isPdfReady && pdfFileName ? (
                  // File uploaded state
                  <motion.div
                    key="uploaded"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-between p-4 rounded-xl border border-[var(--success)]/30 bg-[var(--success-light)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[var(--success)]/20 flex items-center justify-center">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="var(--success)"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <div>
                        <p
                          className="font-medium text-sm"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {pdfFileName}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--success)' }}>
                          Ready to process
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="p-2 rounded-lg hover:bg-[var(--error-light)] transition-colors cursor-pointer"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="var(--error)"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </motion.div>
                ) : isLoading ? (
                  // Loading state
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center gap-3 p-8 rounded-xl border border-[var(--warning)]/30 bg-[var(--warning-light)]"
                  >
                    <svg
                      className="w-5 h-5 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="var(--warning)"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="var(--warning)"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    <span style={{ color: 'var(--text-primary)' }}>
                      Processing {pdfFileName}...
                    </span>
                  </motion.div>
                ) : (
                  // Upload zone
                  <motion.div
                    key="upload"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleFileButtonClick}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                      'relative p-6 md:p-10 rounded-xl border-2 border-dashed text-center cursor-pointer transition-all duration-200',
                      isDragging
                        ? 'border-[var(--accent-color)] bg-[var(--accent-light)]'
                        : 'border-[var(--border-color)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-muted)]'
                    )}
                  >
                    <div className="space-y-3">
                      <div
                        className={cn(
                          'w-12 h-12 mx-auto rounded-xl flex items-center justify-center transition-colors',
                          isDragging
                            ? 'bg-[var(--accent-color)]/20'
                            : 'bg-[var(--bg-muted)]'
                        )}
                      >
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke={isDragging ? 'var(--accent-color)' : 'var(--text-tertiary)'}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                      </div>
                      <div>
                        <p
                          className="font-medium text-sm"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {isDragging ? 'Drop your file here' : 'Drag and drop your resume'}
                        </p>
                        <p
                          className="text-xs mt-1"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          or click to browse (PDF only)
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Questions Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label
                  className="block text-sm font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Application Questions
                  <span className="ml-2 text-xs font-normal" style={{ color: 'var(--text-tertiary)' }}>
                    (Optional - you can add more later)
                  </span>
                </label>
              </div>

              <AnimatePresence mode="popLayout">
                {fields.map((field, index) => (
                  <motion.div
                    key={field.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-xs font-medium"
                        style={{ color: 'var(--accent-color)' }}
                      >
                        {index + 1}
                      </span>
                      <div className="flex-1 space-y-3">
                        <textarea
                          {...register(`questions.${index}.question` as const)}
                          rows={2}
                          placeholder="Enter your application question..."
                          style={{
                            backgroundColor: 'var(--bg-body)',
                            color: 'var(--text-primary)',
                            borderColor: 'var(--border-color)',
                          }}
                          className="w-full px-3 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent resize-none"
                        />
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <label
                              htmlFor={`wordLimit-${index}`}
                              className="text-xs"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              Word limit
                            </label>
                            <input
                              id={`wordLimit-${index}`}
                              type="number"
                              {...register(`questions.${index}.wordLimit` as const, {
                                valueAsNumber: true,
                                min: 10,
                                max: 1000,
                              })}
                              placeholder="Auto"
                              min={10}
                              max={1000}
                              style={{
                                backgroundColor: 'var(--bg-body)',
                                color: 'var(--text-primary)',
                                borderColor: 'var(--border-color)',
                              }}
                              className="w-20 px-2 py-1 rounded-lg border text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="ml-auto p-1.5 rounded-lg hover:bg-[var(--error-light)] transition-colors"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="var(--error)"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Add Question Button */}
              <motion.button
                type="button"
                onClick={addQuestion}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full p-4 rounded-xl border-2 border-dashed border-[var(--border-color)] hover:border-[var(--accent-color)] hover:bg-[var(--accent-light)] transition-all duration-200 flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="var(--accent-color)"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span className="text-sm font-medium" style={{ color: 'var(--accent-color)' }}>
                  Add Question
                </span>
              </motion.button>

              {fields.length === 0 && (
                <p className="text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>
                  Start a session now and add questions later, or add them above to get answers immediately
                </p>
              )}
            </div>

            {/* Credit Warning Banner */}
            {authGuard.isAuthenticated && (
              <CreditWarningBanner
                credits={displayCredits}
                subscriptionStatus={subscriptionStatus}
              />
            )}

            {/* Error Display */}
            {submitError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl border border-[var(--error)]/30 bg-[var(--error-light)]"
              >
                <p className="text-sm" style={{ color: 'var(--error)' }}>
                  {submitError}
                </p>
              </motion.div>
            )}

            {/* Submit Button */}
            <Tooltip
              content={<ValidationTooltipContent missingRequirements={missingRequirements} />}
              enabled={showValidationTooltip}
              position="top"
            >
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={!isPdfReady || isSubmitting || (authGuard.isAuthenticated && !canGenerate)}
                isLoading={isSubmitting}
              >
                {isSubmitting ? (
                  'Starting Q&A Session...'
                ) : authGuard.isAuthenticated && !canGenerate ? (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    Out of Credits - Upgrade Required
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {questions.length > 0 ? 'Generate Answers' : 'Start Q&A Session'}
                  </>
                )}
              </Button>
            </Tooltip>

            {/* Helper text */}
            <p
              className="text-center text-xs"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {subscriptionStatus === 'premium' ? (
                'Unlimited sessions with Premium'
              ) : (
                <>
                  Uses 1 credit to start a session
                  {authGuard.isAuthenticated && (
                    <span> · {displayCredits} credit{displayCredits !== 1 ? 's' : ''} remaining</span>
                  )}
                </>
              )}
            </p>

            <p
              className="text-center text-xs"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Adding questions and regenerating answers within a session is free
            </p>
          </form>
        </CardContent>
      </Card>

      {/* Login Modal - appears when unauthenticated user tries to submit */}
      <LoginModal
        isOpen={authGuard.showLoginModal}
        onClose={() => authGuard.setShowLoginModal(false)}
        onLoginSuccess={authGuard.onLoginSuccess}
      />
    </FadeIn>
  )
}

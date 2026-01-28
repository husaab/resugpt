'use client'

import { useState, useEffect, useRef, ChangeEvent, DragEvent } from 'react'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { FadeIn } from './motion/fade-in'
import { cn } from '@/lib/utils'
import { LoginModal } from './auth/LoginModal'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { useFormPersistence } from '@/hooks/useFormPersistence'

// Dynamic import for pdfjs to avoid SSR issues
let pdfjsLib: any = null

interface FormData {
  pdf: string | null
  jobDescription: string
}

export function ResumeForm() {
  const [isPdfReady, setIsPdfReady] = useState<boolean>(false)
  const [pdfFileName, setPdfFileName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auth guard and form persistence hooks
  const authGuard = useAuthGuard()
  const { saveFormData, getFormData, clearFormData } = useFormPersistence()

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
    formState: { errors, isSubmitting },
    watch,
  } = useForm<FormData>()

  // Restore form state from localStorage after successful login
  useEffect(() => {
    if (authGuard.isAuthenticated) {
      const savedData = getFormData()
      if (savedData) {
        // Restore form values silently
        if (savedData.pdf) {
          setValue('pdf', savedData.pdf)
          setIsPdfReady(true)
        }
        if (savedData.pdfFileName) {
          setPdfFileName(savedData.pdfFileName)
        }
        if (savedData.jobDescription) {
          setValue('jobDescription', savedData.jobDescription)
        }
        // Clear localStorage after restoration
        clearFormData()
      }
    }
  }, [authGuard.isAuthenticated, getFormData, setValue, clearFormData])

  const jobDescription = watch('jobDescription')

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

    setValue('pdf', null)
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
          setValue('pdf', textBuilder)
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
        pdf: data.pdf,
        jobDescription: data.jobDescription,
        pdfFileName: pdfFileName,
      })
      // Show login modal
      authGuard.setShowLoginModal(true)
      return
    }

    // User is authenticated - proceed with submission
    console.log('Form submitted:', data)
    alert('Form submitted! Check console for data.')
  }

  const removeFile = () => {
    setValue('pdf', null)
    setIsPdfReady(false)
    setPdfFileName(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

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
                id="pdf"
                type="file"
                accept="application/pdf"
                {...register('pdf', {
                  required: 'Please upload your resume',
                })}
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
                        : errors.pdf
                        ? 'border-[var(--error)] bg-[var(--error-light)]'
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

              {errors.pdf && (
                <p className="text-sm" style={{ color: 'var(--error)' }}>
                  {errors.pdf.message}
                </p>
              )}
            </div>

            {/* Job Description */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="jobDescription"
                  className="block text-sm font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Job Description
                </label>
                {jobDescription && (
                  <span
                    className="text-xs"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {jobDescription.length} characters
                  </span>
                )}
              </div>
              <textarea
                id="jobDescription"
                rows={5}
                style={{
                  backgroundColor: 'var(--bg-body)',
                  color: 'var(--text-primary)',
                  borderColor: errors.jobDescription
                    ? 'var(--error)'
                    : 'var(--border-color)',
                }}
                className="w-full px-4 py-3 rounded-xl border text-base transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent resize-none"
                placeholder="Paste the job description or requirements here..."
                {...register('jobDescription', {
                  required: 'Please provide the job description',
                  minLength: {
                    value: 10,
                    message: 'Job description must be at least 10 characters long',
                  },
                })}
              />
              {errors.jobDescription && (
                <p className="text-sm" style={{ color: 'var(--error)' }}>
                  {errors.jobDescription.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={!isPdfReady}
              isLoading={isSubmitting}
            >
              {isSubmitting ? (
                'Generating...'
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
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Generate Tailored Resume
                </>
              )}
            </Button>

            {/* Helper text */}
            <p
              className="text-center text-xs"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Uses 1 credit per generation
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

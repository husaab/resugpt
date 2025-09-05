'use client'

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useForm } from 'react-hook-form'
import { DocumentIcon } from '@heroicons/react/24/outline'

// Dynamic import for pdfjs to avoid SSR issues
let pdfjsLib: any = null

interface FormData {
    pdf: string | null
    jobDescription: string
}

export function ResumeForm() {

    const [isPdfReady, setIsPdfReady] = useState<boolean>(false);
    const [pdfFileName, setPdfFileName] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const loadPdfJs = async () => {
          try {
            pdfjsLib = await import('pdfjs-dist')
            // Use the worker from node_modules instead of CDN
            pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
              'pdfjs-dist/build/pdf.worker.min.mjs',
              import.meta.url
            ).toString()
          } catch (error) {
            console.error('Failed to load PDF.js:', error)
            // Fallback to legacy worker if the modern one fails
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

    const { handleSubmit, register,
        setValue, formState: { errors, isSubmitting }, } = useForm<FormData>()

    const handleFileButtonClick = () => {
        fileInputRef.current?.click()
    }

    async function onFileUpload(event: ChangeEvent<HTMLInputElement>) {
        if (event.target.files == null || event.target.files.length === 0) return
        if (!pdfjsLib) {
            alert('PDF processing is still loading. Please try again in a moment.')
            return
        }
    
        setValue('pdf', null)
        setIsPdfReady(false)
        setPdfFileName(null)
        setIsLoading(true)
        
        const pdfFile = event.target.files[0]
        setPdfFileName(pdfFile.name)
    
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
              console.log(textBuilder)
              setIsLoading(false)
            })
            .catch((err: any) => {
              alert('An error occurred uploading your PDF. Please try again.')
              console.error(err)
              setIsLoading(false)
            })
        }
    
        try {
          fileReader.readAsArrayBuffer(pdfFile)
        } catch (error) {
          alert('An error occurred uploading your PDF. Please try again.')
          setIsLoading(false)
        }
    }

    const onSubmit = async (data: FormData) => {
        console.log('Form submitted:', data)
        // TODO: Implement form submission logic
        alert('Form submitted! Check console for data.')
    }

    return (
        <div style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="max-w-2xl mx-auto border rounded-lg p-8 mt-12 transition-colors">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="text-center mb-6">
              <h2 style={{ color: 'var(--text-primary)' }} className="text-2xl font-bold mb-2 transition-colors">Upload Your Resume</h2>
              <p style={{ color: 'var(--text-primary)' }} className="opacity-75 transition-colors">Upload your PDF resume and job description to get started</p>
            </div>
    
            {/* PDF Upload */}
            <div className="space-y-2">
              <label style={{ color: 'var(--text-primary)' }} className="block text-sm font-medium transition-colors">Resume (PDF Only)</label>
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
              
              <div 
                style={{ 
                  borderColor: errors.pdf ? '#ef4444' : 'var(--border-color)',
                  backgroundColor: errors.pdf ? '#fef2f2' : 'var(--bg-body)'
                }}
                className="border rounded-lg p-3 flex items-center justify-between transition-colors hover:opacity-80"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-yellow-400 text-sm">Processing {pdfFileName}...</span>
                  </div>
                ) : isPdfReady && pdfFileName ? (
                  <div className="flex items-center justify-between w-full">
                    <span className="text-green-400 text-sm">✓ {pdfFileName}</span>
                    <button
                      type="button"
                      onClick={handleFileButtonClick}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <span style={{ color: 'var(--text-primary)' }} className="opacity-60 text-sm transition-colors">No file selected</span>
                    <button
                      type="button"
                      onClick={handleFileButtonClick}
                      className="cursor-pointer bg-[#005b96] hover:bg-[#004578] text-white px-4 py-1 rounded text-sm transition-colors"
                    >
                      Choose PDF
                    </button>
                  </div>
                )}
              </div>
              
              {errors.pdf && (
                <p className="text-red-500 text-sm mt-1">{errors.pdf.message}</p>
              )}
            </div>
    
            {/* Job Description */}
            <div className="space-y-2">
              <label htmlFor="jobDescription" style={{ color: 'var(--text-primary)' }} className="block text-sm font-medium transition-colors">
                Job Description
              </label>
              <textarea
                id="jobDescription"
                rows={6}
                style={{
                  backgroundColor: 'var(--bg-body)',
                  color: 'var(--text-primary)',
                  borderColor: errors.jobDescription ? '#ef4444' : 'var(--border-color)'
                }}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Paste the job description or requirements here..."
                {...register('jobDescription', {
                  required: 'Please provide the job description',
                  minLength: {
                    value: 10,
                    message: 'Job description must be at least 10 characters long'
                  }
                })}
              />
              {errors.jobDescription && (
                <p className="text-red-500 text-sm mt-1">{errors.jobDescription.message}</p>
              )}
            </div>
    
            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !isPdfReady}
              className={`w-full py-3 px-4 rounded-md font-semibold text-lg cursor-pointer transition-colors ${
                isSubmitting || !isPdfReady
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-[#005b96] hover:bg-[#004578] text-white'
              }`}
            >
              {isSubmitting ? 'Processing...' : 'Generate Tailored Resume'}
            </button>
          </form>
        </div>
      )

}
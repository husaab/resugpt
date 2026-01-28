'use client'

import { Button } from '@/components/ui/button'
import { ArrowPathIcon, ArrowDownTrayIcon, DocumentIcon } from '@heroicons/react/24/outline'

interface CoverLetterPreviewPanelProps {
  pdfUrl: string | null
  isCompiling: boolean
  onCompile: () => void
  onDownload: () => void
  error?: string | null
}

export function CoverLetterPreviewPanel({
  pdfUrl,
  isCompiling,
  onCompile,
  onDownload,
  error,
}: CoverLetterPreviewPanelProps) {
  return (
    <div className="h-full flex flex-col bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-color)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b border-[var(--border-color)] bg-[var(--bg-muted)]">
        <h3 className="font-semibold text-[var(--text-primary)] text-sm sm:text-base">Preview</h3>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onCompile}
            isLoading={isCompiling}
            disabled={isCompiling}
            className="!px-2 sm:!px-4"
          >
            <ArrowPathIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{isCompiling ? 'Generating...' : 'Generate PDF'}</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onDownload}
            disabled={!pdfUrl || isCompiling}
            className="!px-2 sm:!px-4"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Download</span>
          </Button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 relative overflow-hidden">
        {error && (
          <div className="absolute inset-x-0 top-0 z-10 p-3 bg-[var(--error-light)] border-b border-[var(--error)]">
            <p className="text-sm text-[var(--error)]">{error}</p>
          </div>
        )}

        {pdfUrl ? (
          <iframe
            src={`${pdfUrl}#pagemode=none`}
            className="w-full h-full border-0"
            title="Cover Letter PDF Preview"
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-[var(--text-tertiary)]">
            <DocumentIcon className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No preview yet</p>
            <p className="text-sm text-center max-w-xs">
              Click &quot;Generate PDF&quot; to create a preview of your cover letter
            </p>
          </div>
        )}

        {isCompiling && (
          <div className="absolute inset-0 bg-[var(--bg-body)]/80 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-[var(--accent-color)] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-[var(--text-secondary)]">Generating PDF...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

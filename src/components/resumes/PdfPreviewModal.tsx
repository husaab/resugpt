'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'

interface PdfPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  pdfUrl: string | null
  title: string
  onDownload: () => void
}

export function PdfPreviewModal({
  isOpen,
  onClose,
  pdfUrl,
  title,
  onDownload
}: PdfPreviewModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-4 md:inset-8 z-50 flex flex-col bg-[var(--bg-elevated)] rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
              <h2 className="font-semibold text-[var(--text-primary)] truncate">
                {title}
              </h2>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={onDownload}>
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  Download
                </Button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-[var(--bg-muted)] transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-[var(--text-secondary)]" />
                </button>
              </div>
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 bg-[var(--bg-muted)]">
              {pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  className="w-full h-full"
                  title={title}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-[var(--text-secondary)]">
                    PDF not available
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

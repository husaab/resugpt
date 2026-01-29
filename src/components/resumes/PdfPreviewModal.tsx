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

          {/* Desktop Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="hidden md:flex fixed inset-8 lg:inset-16 z-50 flex-col bg-[var(--bg-elevated)] rounded-2xl overflow-hidden shadow-2xl"
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

          {/* Mobile Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="md:hidden fixed inset-x-0 bottom-0 z-50 bg-[var(--bg-elevated)] rounded-t-2xl overflow-hidden shadow-2xl"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-[var(--border-color)]" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-color)]">
              <h2 className="font-semibold text-[var(--text-primary)] truncate text-sm flex-1 mr-2">
                {title}
              </h2>
              <div className="flex items-center gap-2">
                <Button variant="primary" size="sm" onClick={onDownload} className="!px-3">
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  <span className="hidden xs:inline">Download</span>
                </Button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-[var(--bg-muted)] transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-[var(--text-secondary)]" />
                </button>
              </div>
            </div>

            {/* PDF Viewer - fixed height for mobile */}
            <div className="h-[70vh] bg-[var(--bg-muted)]">
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

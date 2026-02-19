'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface ModalShellProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'md' | 'lg' | 'xl'
}

export function ModalShell({ isOpen, onClose, title, children, size = 'md' }: ModalShellProps) {
  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className={`relative bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-2xl shadow-xl w-full ${
              size === 'xl' ? 'max-w-4xl' : size === 'lg' ? 'max-w-2xl' : 'max-w-md'
            } max-h-[90vh] overflow-y-auto`}
          >
            <div className="sticky top-0 flex items-center justify-between p-6 pb-4 bg-[var(--bg-elevated)] border-b border-[var(--border-color)] rounded-t-2xl">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 pt-4">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

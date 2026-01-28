'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  EllipsisVerticalIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  CalendarDaysIcon,
  BuildingOffice2Icon
} from '@heroicons/react/24/outline'

interface ResumeCardProps {
  id: string
  title: string
  targetRole?: string | null
  updatedAt: string
  thumbnailUrl?: string | null
  onPreview: (id: string) => void
  onDownload: (id: string) => void
  onDelete: (id: string) => void
}

export function ResumeCard({
  id,
  title,
  targetRole,
  updatedAt,
  thumbnailUrl,
  onPreview,
  onDownload,
  onDelete
}: ResumeCardProps) {
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleClick = () => {
    router.push(`/editor/${id}`)
  }

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation()

    // Calculate position for portal-based menu
    if (menuButtonRef.current) {
      const rect = menuButtonRef.current.getBoundingClientRect()
      setMenuPosition({
        top: rect.bottom + 4,
        left: rect.right - 176 // 176px = w-44 (11rem)
      })
    }

    setShowMenu(!showMenu)
  }

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation()
    setShowMenu(false)
    action()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handleClick}
      className="relative group cursor-pointer"
    >
      {/* Card Container */}
      <div className="relative bg-[var(--bg-elevated)] rounded-2xl overflow-hidden border border-[var(--border-color)] shadow-sm transition-all duration-300 group-hover:shadow-xl group-hover:border-[var(--accent-color)]/30">

        {/* Thumbnail Section */}
        <div className="relative aspect-[8.5/11] bg-gradient-to-br from-[var(--bg-muted)] to-[var(--bg-body)] overflow-hidden">
          {thumbnailUrl && !imageError ? (
            <motion.img
              src={thumbnailUrl}
              alt={title}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
              initial={{ scale: 1 }}
              animate={{ scale: isHovered ? 1.05 : 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6">
              <div className="w-16 h-16 rounded-2xl bg-[var(--accent-color)]/10 flex items-center justify-center">
                <DocumentTextIcon className="w-8 h-8 text-[var(--accent-color)]" />
              </div>
              <span className="text-xs text-[var(--text-tertiary)] text-center">
                Preview not available
              </span>
            </div>
          )}

          {/* Hover Overlay with Edit Button */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end justify-center pb-6"
              >
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 10, opacity: 0 }}
                  transition={{ delay: 0.05 }}
                  className="flex items-center gap-2 px-4 py-2 bg-white/95 backdrop-blur-sm rounded-full shadow-lg"
                >
                  <PencilSquareIcon className="w-4 h-4 text-gray-700" />
                  <span className="text-sm font-medium text-gray-700">Edit Resume</span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Content Section */}
        <div className="p-4 space-y-3">
          {/* Title Row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[var(--text-primary)] text-base leading-tight line-clamp-2">
                {title}
              </h3>
            </div>

            {/* Kebab Menu */}
            <div className="relative flex-shrink-0">
              <button
                ref={menuButtonRef}
                onClick={handleMenuClick}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-muted)] transition-colors"
                aria-label="More options"
              >
                <EllipsisVerticalIcon className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>

              {/* Portal-based dropdown menu to escape overflow:hidden */}
              {mounted && showMenu && createPortal(
                <AnimatePresence>
                  {showMenu && (
                    <>
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 z-[9998]"
                        onClick={(e) => handleAction(e, () => {})}
                      />

                      {/* Menu */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.15 }}
                        style={{
                          position: 'fixed',
                          top: menuPosition.top,
                          left: menuPosition.left,
                        }}
                        className="z-[9999] w-44 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl shadow-xl overflow-hidden"
                      >
                        <button
                          onClick={(e) => handleAction(e, () => onPreview(id))}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors"
                        >
                          <EyeIcon className="w-4 h-4 text-[var(--text-secondary)]" />
                          Preview PDF
                        </button>
                        <button
                          onClick={(e) => handleAction(e, () => onDownload(id))}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors"
                        >
                          <ArrowDownTrayIcon className="w-4 h-4 text-[var(--text-secondary)]" />
                          Download
                        </button>
                        <div className="h-px bg-[var(--border-color)] mx-3" />
                        <button
                          onClick={(e) => handleAction(e, () => onDelete(id))}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                          Delete
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>,
                document.body
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="flex flex-col gap-1.5">
            {targetRole && (
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <BuildingOffice2Icon className="w-4 h-4 flex-shrink-0 text-[var(--text-tertiary)]" />
                <span className="truncate">{targetRole}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
              <CalendarDaysIcon className="w-4 h-4 flex-shrink-0" />
              <span>Updated {formatDate(updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  )
}

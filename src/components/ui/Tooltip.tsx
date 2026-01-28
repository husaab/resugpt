'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface TooltipProps {
  content: ReactNode
  children: ReactNode
  /** Only show tooltip when this is true */
  enabled?: boolean
  /** Position of the tooltip relative to children */
  position?: 'top' | 'bottom'
}

/**
 * A tooltip component that wraps children and shows content on hover/tap.
 * Uses a wrapper div to capture hover events even when children have pointer-events-none.
 */
export function Tooltip({
  content,
  children,
  enabled = true,
  position = 'top',
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const showTooltip = () => {
    if (!enabled) return
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(true)
  }

  const hideTooltip = () => {
    setIsVisible(false)
  }

  // Auto-dismiss after 3 seconds for mobile tap
  const handleClick = () => {
    if (!enabled) return
    if (isVisible) {
      hideTooltip()
    } else {
      showTooltip()
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false)
      }, 3000)
    }
  }

  const positionStyles = position === 'top'
    ? 'bottom-full mb-2'
    : 'top-full mt-2'

  return (
    <div
      className="relative inline-block w-full"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onClick={handleClick}
    >
      {children}
      <AnimatePresence>
        {isVisible && enabled && (
          <motion.div
            initial={{ opacity: 0, y: position === 'top' ? 4 : -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: position === 'top' ? 4 : -4 }}
            transition={{ duration: 0.15 }}
            className={`absolute left-1/2 -translate-x-1/2 z-50 ${positionStyles}`}
          >
            <div
              className="px-4 py-3 rounded-xl shadow-lg border text-sm whitespace-nowrap max-w-xs"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            >
              {content}
            </div>
            {/* Arrow */}
            <div
              className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 border ${
                position === 'top'
                  ? 'top-full -mt-1 border-t-0 border-l-0'
                  : 'bottom-full -mb-1 border-b-0 border-r-0'
              }`}
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

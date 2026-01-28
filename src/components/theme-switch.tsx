'use client'

import { useTheme } from './theme-provider'
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function ThemeSwitch() {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, toggleTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [resolvedTheme])

  const handleClick = () => {
    if (mounted && toggleTheme) {
      toggleTheme()
    }
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      className="relative w-9 h-9 rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] flex items-center justify-center transition-colors hover:border-[var(--border-hover)] hover:bg-[var(--bg-muted)] cursor-pointer"
      aria-label={
        mounted
          ? `Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} mode`
          : 'Theme toggle'
      }
    >
      <AnimatePresence mode="wait" initial={false}>
        {mounted && resolvedTheme === 'dark' ? (
          <motion.div
            key="sun"
            initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
            transition={{ duration: 0.15 }}
          >
            <SunIcon
              className="h-[18px] w-[18px]"
              style={{ color: 'var(--text-secondary)' }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
            transition={{ duration: 0.15 }}
          >
            <MoonIcon
              className="h-[18px] w-[18px]"
              style={{ color: 'var(--text-secondary)' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

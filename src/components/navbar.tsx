'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ThemeSwitch } from './theme-switch'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { SignOutModal } from './auth/SignOutModal'
import { cn } from '@/lib/utils'

export function Navbar() {
  const { data: session } = useSession()
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showSignOutModal, setShowSignOutModal] = useState(false)

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled
            ? 'bg-[var(--bg-body)]/80 backdrop-blur-xl border-b border-[var(--border-color)]'
            : 'bg-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2"
              >
                {/* Logo icon */}
                <div className="w-8 h-8 rounded-lg bg-[var(--accent-color)] flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <span
                  className="text-xl font-bold transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Resu<span style={{ color: 'var(--accent-color)' }}>GPT</span>
                </span>
              </motion.div>
            </Link>

            {/* Right side actions */}
            <div className="flex items-center gap-3">
              <ThemeSwitch />

              <AnimatePresence mode="wait">
                {mounted && session?.user ? (
                  <motion.div
                    key="logged-in"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-3"
                  >
                    {/* Pricing link */}
                    <Link href="/pricing">
                      <motion.span
                        whileHover={{ scale: 1.02 }}
                        className="text-sm font-medium cursor-pointer transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Pricing
                      </motion.span>
                    </Link>

                    {/* Credits badge */}
                    <Badge variant="primary" size="md">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2L13.09 8.26L20 9L14.18 12.74L16.18 20L12 16L7.82 20L9.82 12.74L4 9L10.91 8.26L12 2Z" />
                      </svg>
                      {session.user.credits} credits
                    </Badge>

                    {/* User avatar */}
                    <Link href="/settings">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-8 h-8 rounded-full bg-[var(--accent-light)] flex items-center justify-center cursor-pointer"
                      >
                        <span
                          className="text-sm font-medium"
                          style={{ color: 'var(--accent-color)' }}
                        >
                          {session.user.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </motion.div>
                    </Link>

                    {/* Sign out button */}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowSignOutModal(true)}
                    >
                      Sign Out
                    </Button>
                  </motion.div>
                ) : mounted ? (
                  <motion.div
                    key="logged-out"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-2"
                  >
                    <Link href="/auth">
                      <Button variant="secondary" size="sm">
                        Log in
                      </Button>
                    </Link>
                    <Link href="/pricing">
                      <Button variant="primary" size="sm">
                        Get Started
                      </Button>
                    </Link>
                  </motion.div>
                ) : (
                  // Skeleton while loading
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-16 rounded-xl bg-[var(--bg-muted)] animate-pulse" />
                    <div className="h-9 w-24 rounded-xl bg-[var(--bg-muted)] animate-pulse" />
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Sign Out Confirmation Modal */}
      <SignOutModal
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
      />
    </>
  )
}

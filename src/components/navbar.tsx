'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ThemeSwitch } from './theme-switch'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { SignOutModal } from './auth/SignOutModal'
import { cn } from '@/lib/utils'
import { useCredits } from '@/contexts/CreditContext'

// Navigation link component with proper spacing and hover states
function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link href={href}>
      <motion.span
        className={cn(
          'relative px-3 py-2 text-sm font-medium cursor-pointer transition-colors rounded-lg',
          isActive
            ? 'text-[var(--accent-color)]'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]'
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {children}
        {isActive && (
          <motion.div
            layoutId="navbar-indicator"
            className="absolute bottom-0 left-3 right-3 h-0.5 bg-[var(--accent-color)] rounded-full"
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          />
        )}
      </motion.span>
    </Link>
  )
}

// Mobile navigation link with larger touch targets and staggered animation
function MobileNavLink({
  href,
  children,
  onClick,
  index
}: {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
  index: number;
}) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        ease: [0.25, 0.1, 0.25, 1]
      }}
    >
      <Link href={href} onClick={onClick}>
        <motion.div
          className={cn(
            'flex items-center gap-3 px-4 py-3.5 rounded-xl transition-colors',
            isActive
              ? 'bg-[var(--accent-light)] text-[var(--accent-color)]'
              : 'text-[var(--text-primary)] hover:bg-[var(--bg-muted)]'
          )}
          whileTap={{ scale: 0.98 }}
        >
          <span className="text-base font-medium">{children}</span>
          {isActive && (
            <motion.div
              layoutId="mobile-nav-indicator"
              className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--accent-color)]"
            />
          )}
        </motion.div>
      </Link>
    </motion.div>
  )
}

// Hamburger menu button with morphing animation
function HamburgerButton({ isOpen, onClick }: { isOpen: boolean; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      className="relative w-10 h-10 rounded-xl flex items-center justify-center hover:bg-[var(--bg-muted)] transition-colors sm:hidden"
      whileTap={{ scale: 0.95 }}
      aria-label={isOpen ? 'Close menu' : 'Open menu'}
    >
      <div className="w-5 h-4 flex flex-col justify-between">
        <motion.span
          className="block h-0.5 bg-[var(--text-primary)] rounded-full origin-left"
          animate={{
            rotate: isOpen ? 45 : 0,
            y: isOpen ? -1 : 0,
            width: isOpen ? '120%' : '100%',
          }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        />
        <motion.span
          className="block h-0.5 bg-[var(--text-primary)] rounded-full"
          animate={{
            opacity: isOpen ? 0 : 1,
            x: isOpen ? 8 : 0,
          }}
          transition={{ duration: 0.2 }}
        />
        <motion.span
          className="block h-0.5 bg-[var(--text-primary)] rounded-full origin-left"
          animate={{
            rotate: isOpen ? -45 : 0,
            y: isOpen ? 1 : 0,
            width: isOpen ? '120%' : '100%',
          }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        />
      </div>
    </motion.button>
  )
}

// Vertical divider for visual separation
function NavDivider() {
  return (
    <div className="h-5 w-px bg-[var(--border-color)] mx-1" />
  )
}

export function Navbar() {
  const { data: session } = useSession()
  const { displayCredits, subscriptionStatus } = useCredits()
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showSignOutModal, setShowSignOutModal] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Close mobile menu on route change
  const pathname = usePathname()
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

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
          'fixed top-0 left-0 right-0 z-[55] transition-all duration-300',
          scrolled
            ? 'bg-[var(--bg-body)]/80 backdrop-blur-xl border-b border-[var(--border-color)]'
            : 'bg-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2.5"
              >
                {/* Logo icon */}
                <div className="w-9 h-9 rounded-xl bg-[var(--accent-color)] flex items-center justify-center shadow-sm">
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
                  className="text-xl font-bold tracking-tight transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Resu<span style={{ color: 'var(--accent-color)' }}>GPT</span>
                </span>
              </motion.div>
            </Link>

            {/* Mobile hamburger - positioned after logo on mobile */}
            <div className="flex items-center gap-2 sm:hidden">
              <ThemeSwitch />
              <HamburgerButton
                isOpen={mobileMenuOpen}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              />
            </div>

            {/* Right side actions - hidden on mobile, shown via drawer */}
            <div className="hidden sm:flex items-center gap-2">
              <AnimatePresence mode="wait">
                {mounted && session?.user ? (
                  <motion.div
                    key="logged-in"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center"
                  >
                    {/* Navigation links group */}
                    <nav className="hidden sm:flex items-center gap-1 mr-4">
                      <NavLink href="/cover-letter">Cover Letter</NavLink>
                      <NavLink href="/cover-letters">My Letters</NavLink>
                      <NavLink href="/resumes">My Resumes</NavLink>
                      <NavLink href="/pricing">Pricing</NavLink>
                    </nav>

                    <NavDivider />

                    {/* Theme toggle */}
                    <div className="px-2">
                      <ThemeSwitch />
                    </div>

                    <NavDivider />

                    {/* Credits badge - uses shared context for instant updates */}
                    <div className="px-2">
                      <Badge
                        variant={
                          subscriptionStatus === 'premium'
                            ? 'primary'
                            : displayCredits === 0
                            ? 'error'
                            : displayCredits <= 2
                            ? 'warning'
                            : 'primary'
                        }
                        size="md"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2L13.09 8.26L20 9L14.18 12.74L16.18 20L12 16L7.82 20L9.82 12.74L4 9L10.91 8.26L12 2Z" />
                        </svg>
                        {subscriptionStatus === 'premium'
                          ? 'Unlimited'
                          : `${displayCredits} credit${displayCredits !== 1 ? 's' : ''}`}
                      </Badge>
                    </div>

                    <NavDivider />

                    {/* User actions group */}
                    <div className="flex items-center gap-2 pl-2">
                      {/* User avatar */}
                      <Link href="/settings">
                        <motion.div
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.95 }}
                          className="w-9 h-9 rounded-full bg-[var(--accent-light)] flex items-center justify-center cursor-pointer border-2 border-transparent hover:border-[var(--accent-color)] transition-colors"
                        >
                          <span
                            className="text-sm font-semibold"
                            style={{ color: 'var(--accent-color)' }}
                          >
                            {session.user.name?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </motion.div>
                      </Link>

                      {/* Sign out button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSignOutModal(true)}
                        className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      >
                        Sign Out
                      </Button>
                    </div>
                  </motion.div>
                ) : mounted ? (
                  <motion.div
                    key="logged-out"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-3"
                  >
                    <nav className="hidden sm:flex items-center gap-1">
                      <NavLink href="/cover-letter">Cover Letter</NavLink>
                      <NavLink href="/pricing">Pricing</NavLink>
                    </nav>
                    <NavDivider />
                    <ThemeSwitch />
                    <NavDivider />
                    <Link href="/auth">
                      <Button variant="ghost" size="sm">
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
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-[var(--bg-muted)] animate-pulse" />
                    <div className="h-9 w-20 rounded-xl bg-[var(--bg-muted)] animate-pulse" />
                    <div className="h-9 w-24 rounded-xl bg-[var(--bg-muted)] animate-pulse" />
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[54] bg-black/40 backdrop-blur-sm sm:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-[56] w-[280px] bg-[var(--bg-body)] border-l border-[var(--border-color)] shadow-2xl sm:hidden"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between h-16 px-4 border-b border-[var(--border-color)]">
                <span className="text-sm font-medium text-[var(--text-secondary)]">Menu</span>
                <motion.button
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[var(--bg-muted)] transition-colors"
                  whileTap={{ scale: 0.95 }}
                  aria-label="Close menu"
                >
                  <svg className="w-5 h-5 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>

              {/* Drawer content */}
              <div className="flex flex-col h-[calc(100%-4rem)] overflow-y-auto">
                {/* Navigation links */}
                <nav className="p-4 space-y-1">
                  {mounted && session?.user ? (
                    <>
                      <MobileNavLink href="/cover-letter" onClick={() => setMobileMenuOpen(false)} index={0}>
                        Cover Letter
                      </MobileNavLink>
                      <MobileNavLink href="/cover-letters" onClick={() => setMobileMenuOpen(false)} index={1}>
                        My Letters
                      </MobileNavLink>
                      <MobileNavLink href="/resumes" onClick={() => setMobileMenuOpen(false)} index={2}>
                        My Resumes
                      </MobileNavLink>
                      <MobileNavLink href="/pricing" onClick={() => setMobileMenuOpen(false)} index={3}>
                        Pricing
                      </MobileNavLink>
                      <MobileNavLink href="/settings" onClick={() => setMobileMenuOpen(false)} index={4}>
                        Settings
                      </MobileNavLink>
                    </>
                  ) : mounted ? (
                    <>
                      <MobileNavLink href="/cover-letter" onClick={() => setMobileMenuOpen(false)} index={0}>
                        Cover Letter
                      </MobileNavLink>
                      <MobileNavLink href="/pricing" onClick={() => setMobileMenuOpen(false)} index={1}>
                        Pricing
                      </MobileNavLink>
                    </>
                  ) : null}
                </nav>

                {/* Divider */}
                <div className="mx-4 h-px bg-[var(--border-color)]" />

                {/* User section (when logged in) */}
                {mounted && session?.user && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-4 space-y-4"
                  >
                    {/* Credits display */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-muted)]">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[var(--accent-light)] flex items-center justify-center">
                          <svg className="w-4 h-4 text-[var(--accent-color)]" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2L13.09 8.26L20 9L14.18 12.74L16.18 20L12 16L7.82 20L9.82 12.74L4 9L10.91 8.26L12 2Z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--text-secondary)]">Credits</p>
                          <p className="text-sm font-semibold text-[var(--text-primary)]">
                            {subscriptionStatus === 'premium' ? 'Unlimited' : displayCredits}
                          </p>
                        </div>
                      </div>
                      {subscriptionStatus !== 'premium' && (
                        <Link href="/pricing" onClick={() => setMobileMenuOpen(false)}>
                          <span className="text-xs font-medium text-[var(--accent-color)]">Upgrade</span>
                        </Link>
                      )}
                    </div>

                    {/* User info */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-muted)]">
                      <div className="w-10 h-10 rounded-full bg-[var(--accent-light)] flex items-center justify-center border-2 border-[var(--accent-color)]">
                        <span className="text-sm font-semibold text-[var(--accent-color)]">
                          {session.user.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {session.user.name || 'User'}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)] truncate">
                          {session.user.email}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Bottom actions */}
                <div className="mt-auto p-4 border-t border-[var(--border-color)]">
                  {mounted && session?.user ? (
                    <Button
                      variant="ghost"
                      size="md"
                      onClick={() => {
                        setMobileMenuOpen(false)
                        setShowSignOutModal(true)
                      }}
                      className="w-full justify-center text-[var(--error)]"
                    >
                      Sign Out
                    </Button>
                  ) : mounted ? (
                    <div className="space-y-2">
                      <Link href="/auth" onClick={() => setMobileMenuOpen(false)} className="block">
                        <Button variant="secondary" size="md" className="w-full justify-center">
                          Log in
                        </Button>
                      </Link>
                      <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="block">
                        <Button variant="primary" size="md" className="w-full justify-center">
                          Get Started
                        </Button>
                      </Link>
                    </div>
                  ) : null}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Sign Out Confirmation Modal */}
      <SignOutModal
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
      />
    </>
  )
}

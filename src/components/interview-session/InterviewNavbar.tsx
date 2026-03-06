'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MicrophoneIcon,
  StopIcon,
} from '@heroicons/react/24/outline'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SignOutModal } from '@/components/auth/SignOutModal'
import { ConnectionStatus } from './ConnectionStatus'
import { cn } from '@/lib/utils'
import { useCredits } from '@/contexts/CreditContext'
import { ROUND_TYPE_VARIANT } from '@/components/interview-prep/RoleDetailsContent'
import type { InterviewPhase, RealtimeConnectionState } from '@/types/interviewRealtime'

interface InterviewNavbarProps {
  phase: InterviewPhase
  companyName?: string
  companyLogo?: string | null
  roleTitle?: string
  roundNumber?: number
  totalRounds?: number
  roundType?: string
  roundTitle?: string
  elapsedSeconds?: number
  isMuted?: boolean
  connectionState?: RealtimeConnectionState
  isEndingRound?: boolean
  onToggleMute?: () => void
  onEndRound?: () => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function InterviewNavbar({
  phase,
  companyName,
  companyLogo,
  roleTitle,
  roundNumber,
  totalRounds,
  roundType,
  roundTitle,
  elapsedSeconds = 0,
  isMuted = false,
  connectionState = 'idle',
  isEndingRound = false,
  onToggleMute,
  onEndRound,
}: InterviewNavbarProps) {
  const { data: authSession } = useSession()
  const { displayCredits, subscriptionStatus } = useCredits()
  const [showSignOutModal, setShowSignOutModal] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const showControls = phase === 'active' || phase === 'round-ending'
  const hasSessionInfo = !!companyName && !!roleTitle
  const variant = roundType
    ? (ROUND_TYPE_VARIANT[roundType as keyof typeof ROUND_TYPE_VARIANT] ?? 'default')
    : 'default'

  // Close mobile overflow menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogoClick = () => {
    if (showControls) {
      if (window.confirm('Leaving will end your current interview session. Are you sure?')) {
        router.push('/interview-prep')
      }
    } else {
      router.push('/interview-prep')
    }
  }

  const handleSignOut = () => {
    if (showControls) {
      if (window.confirm('Signing out will end your current interview session. Are you sure?')) {
        setShowSignOutModal(true)
      }
    } else {
      setShowSignOutModal(true)
    }
  }

  return (
    <>
      <nav className="interview-session-nav bg-[var(--bg-elevated)] border-b border-[var(--border-color)] px-3 sm:px-4 flex-shrink-0 z-[55]">
        <div className="flex items-center justify-between h-14 gap-2 sm:gap-4">
          {/* ── Left: Logo + Session Info ────────────────── */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* ResuGPT Logo */}
            <button
              onClick={handleLogoClick}
              className="flex items-center gap-2 flex-shrink-0 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-color)] flex items-center justify-center shadow-sm">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span
                className="text-lg font-bold tracking-tight hidden sm:inline"
                style={{ color: 'var(--text-primary)' }}
              >
                Resu<span style={{ color: 'var(--accent-color)' }}>GPT</span>
              </span>
            </button>

            {/* Divider */}
            {hasSessionInfo && (
              <div className="h-6 w-px bg-[var(--border-color)] flex-shrink-0 hidden sm:block" />
            )}

            {/* Session info */}
            {hasSessionInfo && (
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {companyLogo && (
                    <div className="w-6 h-6 rounded bg-[var(--bg-muted)] border border-[var(--border-color)] flex items-center justify-center overflow-hidden flex-shrink-0">
                      <img src={companyLogo} alt={companyName} className="w-full h-full object-contain p-0.5" />
                    </div>
                  )}
                  <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
                    {roleTitle}
                  </span>
                  {roundType && (
                    <Badge variant={variant} size="sm" className="flex-shrink-0 hidden sm:inline-flex">
                      {roundType.replace(/_/g, ' ')}
                    </Badge>
                  )}
                </div>
                {roundNumber != null && totalRounds != null && (
                  <p className="text-xs text-[var(--text-tertiary)] truncate hidden sm:block">
                    Round {roundNumber} of {totalRounds}: {roundTitle}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── Right: Controls + Utilities ──────────────── */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Timer + Connection (active phases only) */}
            {showControls && (
              <>
                <span className="font-mono text-base sm:text-lg font-semibold text-[var(--text-primary)]">
                  {formatTime(elapsedSeconds)}
                </span>
                <div className="hidden sm:flex">
                  <ConnectionStatus state={connectionState} />
                </div>
                <div className="h-5 w-px bg-[var(--border-color)] mx-0.5 hidden sm:block" />
              </>
            )}

            {/* Theme switch — desktop only */}
            <div className="hidden sm:block">
              <ThemeSwitch />
            </div>

            {/* Credits badge — desktop only */}
            {authSession?.user && (
              <div className="hidden sm:block">
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
                  size="sm"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L13.09 8.26L20 9L14.18 12.74L16.18 20L12 16L7.82 20L9.82 12.74L4 9L10.91 8.26L12 2Z" />
                  </svg>
                  {subscriptionStatus === 'premium' ? 'Unlimited' : `${displayCredits}`}
                </Badge>
              </div>
            )}

            {/* User avatar — decorative, desktop only */}
            {authSession?.user && (
              <div className="hidden sm:flex w-8 h-8 rounded-full bg-[var(--accent-light)] items-center justify-center pointer-events-none select-none">
                <span className="text-xs font-semibold" style={{ color: 'var(--accent-color)' }}>
                  {authSession.user.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            )}

            {showControls && (
              <div className="h-5 w-px bg-[var(--border-color)] mx-0.5 hidden sm:block" />
            )}

            {/* Mic toggle — active phases only */}
            {showControls && onToggleMute && (
              <button
                onClick={onToggleMute}
                className={cn(
                  'relative p-2 rounded-lg transition-colors',
                  isMuted
                    ? 'bg-[var(--error-light)] text-[var(--error)]'
                    : 'bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                )}
                title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
              >
                <MicrophoneIcon className="w-5 h-5" />
                {isMuted && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="block w-6 h-0.5 bg-[var(--error)] rotate-45 rounded" />
                  </span>
                )}
              </button>
            )}

            {/* End Round button — active phases only */}
            {showControls && onEndRound && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onEndRound}
                isLoading={isEndingRound}
                disabled={connectionState !== 'connected' && !isEndingRound}
              >
                <StopIcon className="w-4 h-4" />
                <span className="hidden sm:inline">End Round</span>
              </Button>
            )}

            {/* Sign out — desktop only */}
            <button
              onClick={handleSignOut}
              className="hidden sm:block text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2 py-1.5 rounded-lg hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
            >
              Sign Out
            </button>

            {/* ── Mobile overflow menu ── */}
            <div className="relative sm:hidden" ref={menuRef}>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-[var(--bg-muted)] transition-colors"
                aria-label="More options"
              >
                <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
                </svg>
              </button>

              <AnimatePresence>
                {mobileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute right-0 top-full mt-1 w-52 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl shadow-lg overflow-hidden z-50"
                  >
                    <div className="p-2 space-y-0.5">
                      {/* Theme toggle */}
                      <div
                        className="flex items-center justify-between px-3 py-2 rounded-lg"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <span className="text-sm text-[var(--text-secondary)]">Theme</span>
                        <ThemeSwitch />
                      </div>

                      {/* Credits */}
                      {authSession?.user && (
                        <div className="flex items-center justify-between px-3 py-2 rounded-lg">
                          <span className="text-sm text-[var(--text-secondary)]">Credits</span>
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
                            size="sm"
                          >
                            {subscriptionStatus === 'premium' ? 'Unlimited' : `${displayCredits}`}
                          </Badge>
                        </div>
                      )}

                      <div className="h-px bg-[var(--border-color)] mx-1" />

                      {/* Sign out */}
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false)
                          handleSignOut()
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-[var(--error)] hover:bg-[var(--bg-muted)] rounded-lg transition-colors cursor-pointer"
                      >
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </nav>

      <SignOutModal
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
      />
    </>
  )
}

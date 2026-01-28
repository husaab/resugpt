'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

interface CreditWarningBannerProps {
  credits: number
  subscriptionStatus?: string
}

/**
 * Displays credit warnings to users:
 * - 0 credits: Red error banner with upgrade CTA
 * - 1-2 credits: Yellow warning banner
 * - Premium or 3+ credits: Not rendered
 */
export function CreditWarningBanner({ credits, subscriptionStatus }: CreditWarningBannerProps) {
  // Premium users don't see credit warnings
  if (subscriptionStatus === 'premium') {
    return null
  }

  // Users with 3+ credits don't need a warning
  if (credits > 2) {
    return null
  }

  // Out of credits - blocking state
  if (credits <= 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-xl border border-[var(--error)]/30 bg-[var(--error-light)]"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--error)]/20 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="var(--error)"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-sm" style={{ color: 'var(--error)' }}>
                Out of Credits
              </h4>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                You need credits to generate tailored resumes. Upgrade to continue.
              </p>
            </div>
          </div>
          <Link href="/pricing">
            <Button variant="primary" size="md" className="w-full sm:w-auto text-sm">
              View Pricing Plans
            </Button>
          </Link>
        </div>
      </motion.div>
    )
  }

  // Low credits warning (1-2 credits)
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl border border-[var(--warning)]/30 bg-[var(--warning-light)]"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[var(--warning)]/20 flex items-center justify-center flex-shrink-0">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="var(--warning)"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
            <span className="font-medium" style={{ color: 'var(--warning)' }}>
              Low on Credits
            </span>
            {' — '}
            You have {credits} credit{credits !== 1 ? 's' : ''} remaining.{' '}
            <Link
              href="/pricing"
              className="font-medium underline underline-offset-2 transition-colors hover:opacity-80"
              style={{ color: 'var(--warning)' }}
            >
              Upgrade your plan
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  )
}

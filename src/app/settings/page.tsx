'use client'

import { Suspense } from 'react'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import { BackgroundGradient } from '@/components/shared/background-gradient'
import { listResumes } from '@/services/resumeService'
import { listCoverLetters } from '@/services/coverLetterService'

function SettingsContent() {
  const { data: session, status, update: updateSession } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mounted, setMounted] = useState(false)
  const [billingLoading, setBillingLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [usageStats, setUsageStats] = useState({
    resumeCount: 0,
    coverLetterCount: 0,
    isLoading: true
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle checkout success - refresh session to get updated subscription
  useEffect(() => {
    if (searchParams.get('checkout') === 'success') {
      setSuccessMessage('Successfully upgraded your subscription!')
      // Refresh the session to get updated subscription status and credits
      updateSession()
      // Clear the URL param
      router.replace('/settings', { scroll: false })
    }
  }, [searchParams, router, updateSession])

  // Handle billing portal redirect
  const handleManageBilling = useCallback(async () => {
    setBillingLoading(true)
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open billing portal')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Billing portal error:', error)
      setBillingLoading(false)
    }
  }, [])

  // Redirect unauthenticated users
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth')
    }
  }, [status, router])

  // Fetch usage statistics
  useEffect(() => {
    const fetchUsageStats = async () => {
      if (!session?.user?.googleId) return

      try {
        const [resumesResponse, coverLettersResponse] = await Promise.all([
          listResumes(session.user.googleId),
          listCoverLetters(session.user.googleId),
        ])

        setUsageStats({
          resumeCount: resumesResponse.success ? resumesResponse.data.length : 0,
          coverLetterCount: coverLettersResponse.success ? coverLettersResponse.data.length : 0,
          isLoading: false,
        })
      } catch (error) {
        console.error('Failed to fetch usage stats:', error)
        setUsageStats({
          resumeCount: 0,
          coverLetterCount: 0,
          isLoading: false,
        })
      }
    }

    if (status === 'authenticated' && session?.user?.googleId) {
      fetchUsageStats()
    }
  }, [session?.user?.googleId, status])

  if (status === 'loading' || !mounted) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 rounded-lg bg-[var(--bg-muted)]" />
            <div className="h-64 rounded-2xl bg-[var(--bg-muted)]" />
            <div className="h-48 rounded-2xl bg-[var(--bg-muted)]" />
          </div>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  const subscriptionBadgeColor = {
    free: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    premium: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    pro: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  }

  const subscriptionStatus = session.user.subscriptionStatus || 'free'

  return (
    <div className="min-h-screen pt-24 pb-16">
      <BackgroundGradient />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Settings
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Manage your account and preferences
          </p>
        </motion.div>

        {/* Success Message */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl flex items-center gap-3"
            style={{
              backgroundColor: 'var(--success-light)',
              color: 'var(--success)',
            }}
          >
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="font-medium">{successMessage}</span>
            <button
              onClick={() => setSuccessMessage(null)}
              className="ml-auto p-1 hover:opacity-70 transition-opacity"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        )}

        <div className="space-y-6">
          {/* Profile Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl border p-6"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-color)',
            }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[var(--accent-color)] flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <h2
                  className="text-lg font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Profile
                </h2>
                <p
                  className="text-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Your account information
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Name
                  </p>
                  <p
                    className="text-base"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {session.user.name || 'Not set'}
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Email
                  </p>
                  <p
                    className="text-base"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {session.user.email || 'Not set'}
                  </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--success-light)]">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="var(--success)"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-xs font-medium" style={{ color: 'var(--success)' }}>
                    Verified
                  </span>
                </div>
              </div>

              {/* User ID */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    User ID
                  </p>
                  <p
                    className="text-sm font-mono"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {session.user.googleId || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Subscription Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-2xl border p-6"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-color)',
            }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[var(--accent-light)] flex items-center justify-center">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="var(--accent-color)"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              </div>
              <div>
                <h2
                  className="text-lg font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Subscription
                </h2>
                <p
                  className="text-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Your plan and billing
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Current Plan */}
              <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Current Plan
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${subscriptionBadgeColor[subscriptionStatus as keyof typeof subscriptionBadgeColor] || subscriptionBadgeColor.free}`}
                    >
                      {subscriptionStatus}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {subscriptionStatus !== 'free' && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleManageBilling}
                      disabled={billingLoading}
                      className="px-4 py-2 rounded-xl font-medium text-sm cursor-pointer border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {billingLoading ? 'Loading...' : 'Manage Billing'}
                    </motion.button>
                  )}
                  {subscriptionStatus === 'free' && (
                    <Link href="/pricing">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-4 py-2 rounded-xl font-medium text-sm cursor-pointer bg-[var(--accent-color)] text-white hover:bg-[var(--accent-hover)] transition-colors"
                      >
                        Upgrade
                      </motion.button>
                    </Link>
                  )}
                </div>
              </div>

              {/* Cancellation Warning */}
              {session.user.cancelAtPeriodEnd && session.user.subscriptionEndsAt && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="py-4 px-4 my-3 rounded-xl border flex items-center gap-4"
                  style={{
                    backgroundColor: 'rgba(251, 191, 36, 0.1)',
                    borderColor: 'rgb(251, 191, 36)',
                  }}
                >
                  <div className="flex-shrink-0">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="rgb(217, 119, 6)"
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
                  <div className="flex-1">
                    <p
                      className="font-medium"
                      style={{ color: 'rgb(146, 64, 14)' }}
                    >
                      Your subscription has been cancelled
                    </p>
                    <p
                      className="text-sm mt-0.5"
                      style={{ color: 'rgb(180, 83, 9)' }}
                    >
                      You&apos;ll have access until {new Date(session.user.subscriptionEndsAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleManageBilling}
                    disabled={billingLoading}
                    className="px-4 py-2 rounded-xl font-medium text-sm cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: 'rgb(217, 119, 6)',
                      color: 'white',
                    }}
                  >
                    {billingLoading ? 'Loading...' : 'Resubscribe'}
                  </motion.button>
                </motion.div>
              )}

              {/* Credits */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Available Credits
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <svg
                      className="w-5 h-5"
                      fill="var(--warning)"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2L13.09 8.26L20 9L14.18 12.74L16.18 20L12 16L7.82 20L9.82 12.74L4 9L10.91 8.26L12 2Z" />
                    </svg>
                    <span
                      className="text-2xl font-bold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {session.user.credits ?? 0}
                    </span>
                    <span
                      className="text-sm"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      credits remaining
                    </span>
                  </div>
                </div>
                <Link href="/pricing">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-4 py-2 rounded-xl font-medium text-sm cursor-pointer border transition-colors"
                    style={{
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    Buy Credits
                  </motion.button>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Usage Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="rounded-2xl border p-6"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-color)',
            }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[var(--bg-muted)] flex items-center justify-center">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="var(--text-secondary)"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div>
                <h2
                  className="text-lg font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Usage
                </h2>
                <p
                  className="text-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Your activity and history
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div
                className="p-4 rounded-xl text-center"
                style={{ backgroundColor: 'var(--bg-muted)' }}
              >
                <p
                  className="text-2xl font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {usageStats.isLoading ? '...' : usageStats.resumeCount}
                </p>
                <p
                  className="text-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Resumes
                </p>
              </div>
              <div
                className="p-4 rounded-xl text-center"
                style={{ backgroundColor: 'var(--bg-muted)' }}
              >
                <p
                  className="text-2xl font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {usageStats.isLoading ? '...' : usageStats.coverLetterCount}
                </p>
                <p
                  className="text-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Cover Letters
                </p>
              </div>
              <div
                className="p-4 rounded-xl text-center"
                style={{ backgroundColor: 'var(--bg-muted)' }}
              >
                <p
                  className="text-2xl font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {usageStats.isLoading ? '...' : (usageStats.resumeCount + usageStats.coverLetterCount)}
                </p>
                <p
                  className="text-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Credits Used
                </p>
              </div>
            </div>
          </motion.div>

          {/* Danger Zone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="rounded-2xl border p-6"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--error)',
            }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--error-light)] flex items-center justify-center">
                <svg
                  className="w-6 h-6"
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
                <h2
                  className="text-lg font-semibold"
                  style={{ color: 'var(--error)' }}
                >
                  Danger Zone
                </h2>
                <p
                  className="text-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Irreversible actions
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p
                  className="font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Delete Account
                </p>
                <p
                  className="text-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Permanently delete your account and all data
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2 rounded-xl font-medium text-sm cursor-pointer border transition-colors"
                style={{
                  borderColor: 'var(--error)',
                  color: 'var(--error)',
                }}
              >
                Delete Account
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 rounded-lg bg-[var(--bg-muted)]" />
            <div className="h-64 rounded-2xl bg-[var(--bg-muted)]" />
            <div className="h-48 rounded-2xl bg-[var(--bg-muted)]" />
          </div>
        </div>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  )
}

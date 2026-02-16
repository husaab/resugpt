'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useAnalytics } from '@/hooks/useAnalytics'

interface SessionRefreshProviderProps {
  children: React.ReactNode
}

/**
 * Automatically refreshes the NextAuth session to keep credits in sync:
 * 1. On initial mount (hard page refresh / new tab)
 * 2. When tab becomes visible again (user returns from another tab)
 *
 * This ensures the frontend always reflects the backend's credit state.
 */
export function SessionRefreshProvider({ children }: SessionRefreshProviderProps) {
  const { status, update } = useSession()
  const { trackEvent } = useAnalytics()
  const hasRefreshedOnMount = useRef(false)
  const hasLoggedLogin = useRef(false)

  // Refresh session on mount (only once, and only if authenticated)
  useEffect(() => {
    if (status === 'authenticated' && !hasRefreshedOnMount.current) {
      hasRefreshedOnMount.current = true
      update().catch((err) => {
        console.error('Failed to refresh session on mount:', err)
      })
    }
  }, [status, update])

  // Track login event once per page load
  useEffect(() => {
    if (status === 'authenticated' && !hasLoggedLogin.current) {
      hasLoggedLogin.current = true
      trackEvent('login', { method: 'google' })
    }
  }, [status, trackEvent])

  // Refresh session when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && status === 'authenticated') {
        update().catch((err) => {
          console.error('Failed to refresh session on visibility change:', err)
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [status, update])

  return <>{children}</>
}

'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { logEvent, setUserId, setUserProperties, type Analytics } from 'firebase/analytics'
import { getFirebaseAnalytics } from '@/lib/firebase'

let cachedAnalytics: Analytics | null = null

async function getAnalyticsInstance(): Promise<Analytics | null> {
  if (cachedAnalytics) return cachedAnalytics
  cachedAnalytics = await getFirebaseAnalytics()
  return cachedAnalytics
}

/**
 * Initializes Firebase Analytics user identity and properties.
 * Returns a `trackEvent` function for logging custom events.
 */
export function useAnalytics() {
  const { data: session, status } = useSession()
  const hasIdentified = useRef(false)

  // Set userId and user properties when authenticated
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user || hasIdentified.current) return
    hasIdentified.current = true

    getAnalyticsInstance().then((analytics) => {
      if (!analytics) return

      setUserId(analytics, session.user.googleId)
      setUserProperties(analytics, {
        subscription_status: session.user.subscriptionStatus || 'free',
        credits_remaining: String(session.user.credits ?? 0),
      })
    })
  }, [status, session])

  const trackEvent = useCallback((eventName: string, params?: Record<string, string | number | boolean>) => {
    getAnalyticsInstance().then((analytics) => {
      if (!analytics) return
      logEvent(analytics, eventName, params)

      if (process.env.NODE_ENV === 'development') {
        console.log(`[Analytics] ${eventName}`, params ?? '')
      }
    })
  }, [])

  return { trackEvent }
}

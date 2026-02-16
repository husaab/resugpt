'use client'

import { createContext, useContext } from 'react'
import { useAnalytics } from '@/hooks/useAnalytics'

type TrackEventFn = (eventName: string, params?: Record<string, string | number | boolean>) => void

const AnalyticsContext = createContext<TrackEventFn>(() => {})

export function useTrackEvent() {
  return useContext(AnalyticsContext)
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { trackEvent } = useAnalytics()

  return (
    <AnalyticsContext.Provider value={trackEvent}>
      {children}
    </AnalyticsContext.Provider>
  )
}

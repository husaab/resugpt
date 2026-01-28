'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { useSession } from 'next-auth/react'

interface CreditContextValue {
  /** Credits to display (optimistic if set, otherwise from session) */
  displayCredits: number
  /** Subscription status from session */
  subscriptionStatus: string | undefined
  /** Whether user can generate (premium or has credits) */
  canGenerate: boolean
  /** Set optimistic credit value for immediate UI feedback */
  setOptimisticCredits: (credits: number | null) => void
  /** Decrement credits optimistically (for non-premium users) */
  decrementCredits: () => void
  /** Clear optimistic value and refresh session */
  refreshCredits: () => Promise<boolean>
}

const CreditContext = createContext<CreditContextValue | null>(null)

interface CreditProviderProps {
  children: ReactNode
}

/**
 * Provides shared credit state across components (navbar, forms).
 * Enables optimistic updates that immediately reflect in all UI.
 */
export function CreditProvider({ children }: CreditProviderProps) {
  const { data: session, update } = useSession()
  const [optimisticCredits, setOptimisticCredits] = useState<number | null>(null)

  const sessionCredits = session?.user?.credits ?? 0
  const subscriptionStatus = session?.user?.subscriptionStatus
  const displayCredits = optimisticCredits !== null ? optimisticCredits : sessionCredits
  const canGenerate = subscriptionStatus === 'premium' || displayCredits > 0

  const decrementCredits = useCallback(() => {
    if (subscriptionStatus !== 'premium') {
      setOptimisticCredits(Math.max(0, sessionCredits - 1))
    }
  }, [subscriptionStatus, sessionCredits])

  const refreshCredits = useCallback(async () => {
    try {
      await update()
      setOptimisticCredits(null)
      return true
    } catch (error) {
      console.error('Failed to refresh credits:', error)
      setOptimisticCredits(null)
      return false
    }
  }, [update])

  return (
    <CreditContext.Provider
      value={{
        displayCredits,
        subscriptionStatus,
        canGenerate,
        setOptimisticCredits,
        decrementCredits,
        refreshCredits,
      }}
    >
      {children}
    </CreditContext.Provider>
  )
}

export function useCredits() {
  const context = useContext(CreditContext)
  if (!context) {
    throw new Error('useCredits must be used within a CreditProvider')
  }
  return context
}

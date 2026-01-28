'use client'

import { useCallback } from 'react'
import { useSession } from 'next-auth/react'

/**
 * Hook to trigger NextAuth session refresh after credit-consuming actions.
 * This ensures the frontend session stays in sync with backend credit changes.
 */
export function useCreditRefresh() {
  const { update } = useSession()

  const refreshCredits = useCallback(async () => {
    try {
      await update() // Triggers JWT callback with trigger === 'update'
      return true
    } catch (error) {
      console.error('Failed to refresh credits:', error)
      return false
    }
  }, [update])

  return { refreshCredits }
}

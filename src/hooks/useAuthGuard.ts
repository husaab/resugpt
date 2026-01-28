'use client'

import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'

export function useAuthGuard() {
  const { data: session, status } = useSession()
  const [showLoginModal, setShowLoginModal] = useState(false)

  const isAuthenticated = !!session?.user
  const isLoading = status === 'loading'

  /**
   * Check if user is authenticated.
   * Returns true if authenticated, false otherwise.
   * Use this to guard actions that require authentication.
   */
  const checkAuth = useCallback((): boolean => {
    if (isAuthenticated) {
      return true
    }
    // User not authenticated - caller should show login modal
    return false
  }, [isAuthenticated])

  /**
   * Call this after successful login to close the modal.
   */
  const onLoginSuccess = useCallback(() => {
    setShowLoginModal(false)
  }, [])

  return {
    isAuthenticated,
    isLoading,
    showLoginModal,
    setShowLoginModal,
    checkAuth,
    onLoginSuccess,
    session,
  }
}

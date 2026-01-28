'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Modal } from '../ui/Modal'
import { popupCenter } from '@/utils/popupCenter'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onLoginSuccess?: () => void
}

export function LoginModal({ isOpen, onClose, onLoginSuccess }: LoginModalProps) {
  const { data: session, status } = useSession()
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const popupRef = useRef<Window | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Detect when session appears (user logged in)
  useEffect(() => {
    if (session?.user && isAuthenticating) {
      setIsAuthenticating(false)
      // Clean up interval when auth succeeds
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      // Close popup window if still open
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close()
      }
      onLoginSuccess?.()
    }
  }, [session, isAuthenticating, onLoginSuccess])

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const handleGoogleLogin = () => {
    // Clear any existing interval from previous clicks (prevents race condition)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    setIsAuthenticating(true)

    // Open the OAuth popup
    popupRef.current = popupCenter('/google-signin', 'Sign in with Google')

    // Check if popup was blocked
    if (!popupRef.current || popupRef.current.closed) {
      setIsAuthenticating(false)
      alert('Please allow popups for this site to sign in with Google')
      return
    }

    // Monitor popup closure
    intervalRef.current = setInterval(() => {
      if (popupRef.current?.closed) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        // Session update will be detected by useEffect above
      }
    }, 500)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false}>
      <div className="text-center mb-6">
        <h2
          style={{ color: 'var(--text-primary)' }}
          className="text-2xl font-bold mb-2 transition-colors"
        >
          Login to Continue
        </h2>
        <p
          style={{ color: 'var(--text-primary)' }}
          className="opacity-75 transition-colors"
        >
          Sign in to generate your tailored resume
        </p>
      </div>

      <button
        onClick={handleGoogleLogin}
        disabled={isAuthenticating || status === 'loading'}
        className="cursor-pointer w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isAuthenticating ? (
          <>
            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            Signing in...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285f4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34a853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#fbbc05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#ea4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </>
        )}
      </button>

      <button
        onClick={onClose}
        disabled={isAuthenticating}
        style={{ color: 'var(--text-primary)' }}
        className="cursor-pointer w-full mt-4 text-sm opacity-60 hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
      >
        Cancel
      </button>

      <p
        style={{ color: 'var(--text-primary)' }}
        className="text-center text-xs opacity-50 mt-4 transition-colors"
      >
        Your resume and job description will be saved
      </p>
    </Modal>
  )
}

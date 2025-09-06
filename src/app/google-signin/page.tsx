'use client'

import { useSession, signIn } from 'next-auth/react'
import { useEffect } from 'react'

export default function GoogleSignIn() {
  const { data: session, status } = useSession()

  useEffect(() => {
    // If not loading and no session, trigger Google OAuth
    if (status !== 'loading' && !session) {
      signIn('google')
    }

    // If session exists, close the popup window
    if (session) {
      window.close()
    }
  }, [session, status])

  return (
    <div className="w-full h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#005b96] mx-auto"></div>
        <p className="mt-4 text-gray-600">Signing in with Google...</p>
      </div>
    </div>
  )
}
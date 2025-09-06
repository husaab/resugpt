'use client'

import { ThemeSwitch } from './theme-switch'
import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'

export function Navbar() {
  const { data: session } = useSession()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <nav style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-body)' }} className="fixed top-0 left-0 right-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <Link href="/">
              <h1 style={{ color: 'var(--accent-color)' }} className="text-2xl font-bold cursor-pointer transition-colors hover:opacity-80">
                ResuGPT
              </h1>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <ThemeSwitch />

            {session?.user ? (
              // Logged in state
              <>
                <div className="flex items-center space-x-3">
                  <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
                    <span className="opacity-75">Credits: </span>
                    <span className="font-bold">{session.user.credits}</span>
                  </div>
                  
                  <div className="w-8 h-8 rounded-full bg-[#005b96] flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                  
                  <button 
                    onClick={handleSignOut}
                    className="cursor-pointer border border-[#005b96] text-[#005b96] hover:bg-[#005b96] hover:text-white px-4 py-2 rounded-md font-medium transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              // Not logged in state
              <>
                <Link 
                  href="/"
                  className="cursor-pointer bg-[#005b96] hover:bg-[#004578] text-white px-4 py-2 rounded-md font-medium transition-colors text-center inline-block"
                >
                  Try Now
                </Link>

                <Link 
                  href="/auth" 
                  className="cursor-pointer border border-[#005b96] text-[#005b96] hover:bg-[#005b96] hover:text-white px-4 py-2 rounded-md font-medium transition-colors text-center inline-block"
                >
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
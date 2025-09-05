'use client'

import { BackgroundIcons } from '../../components/background-icons'

export default function AuthPage() {
  const handleGoogleLogin = () => {
    // TODO: Will use signIn('google') when we add next-auth/react
    console.log('Google login clicked')
  }

  return (
    <div className="h-screen flex items-center overflow-hidden pt-16">
      <BackgroundIcons />
      <div 
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        className="max-w-md w-full mx-auto border rounded-lg p-8 transition-colors mb-40"
      >
        <div className="text-center mb-8">
          <h1 style={{ color: 'var(--accent-color)' }} className="text-3xl font-bold mb-2">
            ResuGPT
          </h1>
          <p style={{ color: 'var(--text-primary)' }} className="opacity-75">
            Sign in to create perfect resumes with AI
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            className="cursor-pointer w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 px-4 py-3 rounded-lg font-medium transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="relative">

            <div className="relative flex justify-center text-sm">
              <span style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }} className="px-2 opacity-60">
                Quick & secure authentication
              </span>
            </div>
          </div>

          <div style={{ color: 'var(--text-primary)' }} className="text-center text-sm opacity-75">
            <p>
              By continuing, you agree to our{' '}
              <a href="#" className="underline hover:opacity-100">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="underline hover:opacity-100">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
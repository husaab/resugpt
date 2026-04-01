'use client'

import { motion } from 'framer-motion'
import { popupCenter } from '../../utils/popupCenter'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

// Floating geometric shape component
function FloatingShape({
  className,
  delay = 0,
  duration = 20,
}: {
  className: string
  delay?: number
  duration?: number
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1,
        y: [0, -15, 0],
        rotate: [0, 3, -3, 0],
      }}
      transition={{
        opacity: { duration: 0.8, delay },
        y: { duration, repeat: Infinity, ease: 'easeInOut', delay },
        rotate: { duration: duration * 1.3, repeat: Infinity, ease: 'easeInOut', delay },
      }}
    />
  )
}

// Feature highlight item
function FeatureItem({
  icon,
  title,
  description,
  delay,
}: {
  icon: React.ReactNode
  title: string
  description: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex items-start gap-4"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
        {icon}
      </div>
      <div>
        <h3 className="text-white font-semibold text-sm tracking-wide">{title}</h3>
        <p className="text-white/60 text-sm mt-0.5 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  )
}

export default function AuthPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (session?.user) {
      router.push('/')
    }
  }, [session, router])

  const handleGoogleLogin = () => {
    setIsLoading(true)
    const popup = popupCenter('/google-signin', 'Sign in with Google')

    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed)
        router.push('/')
      }
    }, 1000)

    // Reset loading if user closes popup without signing in
    setTimeout(() => setIsLoading(false), 3000)
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel — Brand & Visual */}
      <div className="relative lg:w-[55%] bg-gradient-to-br from-[#003d66] via-[#005b96] to-[#0077cc] dark:from-[#0a1628] dark:via-[#0d2847] dark:to-[#1a3a5f] overflow-hidden flex flex-col justify-between p-8 sm:p-12 lg:p-16">
        {/* Grain texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Gradient mesh overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />

        {/* Floating geometric shapes */}
        <FloatingShape
          className="absolute top-[12%] right-[15%] w-32 h-32 rounded-3xl bg-white/[0.04] border border-white/[0.06] backdrop-blur-sm rotate-12"
          delay={0.2}
          duration={18}
        />
        <FloatingShape
          className="absolute top-[45%] right-[8%] w-20 h-20 rounded-2xl bg-white/[0.06] border border-white/[0.08] rotate-[-20deg]"
          delay={0.5}
          duration={22}
        />
        <FloatingShape
          className="absolute bottom-[20%] left-[10%] w-24 h-24 rounded-full bg-white/[0.03] border border-white/[0.05]"
          delay={0.8}
          duration={25}
        />
        <FloatingShape
          className="absolute top-[25%] left-[5%] w-16 h-16 rounded-xl bg-white/[0.05] border border-white/[0.07] rotate-45"
          delay={1.0}
          duration={20}
        />
        <FloatingShape
          className="absolute bottom-[35%] right-[25%] w-14 h-14 rounded-lg bg-white/[0.04] border border-white/[0.06] rotate-[-12deg]"
          delay={0.3}
          duration={16}
        />

        {/* Spacer for navbar clearance */}
        <div className="relative z-10 h-8" />

        {/* Center content — headline */}
        <div className="relative z-10 my-8 lg:my-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-[1.15] tracking-tight">
              Your career,{' '}
              <span className="relative">
                powered by AI
                <motion.div
                  className="absolute -bottom-1 left-0 right-0 h-[3px] bg-gradient-to-r from-white/60 to-white/0 rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.6, delay: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                  style={{ transformOrigin: 'left' }}
                />
              </span>
            </h1>
            <p className="mt-4 text-white/50 text-lg max-w-md leading-relaxed">
              Professional resumes, tailored cover letters, and interview prep — all in one place.
            </p>
          </motion.div>

          {/* Feature highlights */}
          <div className="mt-10 space-y-5 hidden sm:block">
            <FeatureItem
              icon={
                <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
              title="ATS-Optimized Resumes"
              description="AI crafts resumes that pass applicant tracking systems"
              delay={0.4}
            />
            <FeatureItem
              icon={
                <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
              title="Tailored Cover Letters"
              description="Personalized letters matched to each job description"
              delay={0.55}
            />
            <FeatureItem
              icon={
                <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              }
              title="AI Interview Prep"
              description="Practice with real-time AI-powered mock interviews"
              delay={0.7}
            />
          </div>
        </div>

        {/* Bottom stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="relative z-10 hidden lg:flex items-center gap-8"
        >
          <div>
            <p className="text-2xl font-bold text-white">10k+</p>
            <p className="text-white/40 text-sm">Resumes created</p>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div>
            <p className="text-2xl font-bold text-white">95%</p>
            <p className="text-white/40 text-sm">ATS pass rate</p>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div>
            <p className="text-2xl font-bold text-white">3 min</p>
            <p className="text-white/40 text-sm">Average creation time</p>
          </div>
        </motion.div>
      </div>

      {/* Right Panel — Sign In Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-[var(--bg-body)] relative">
        {/* Subtle background pattern */}
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, var(--text-tertiary) 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full max-w-sm relative z-10"
        >
          {/* Heading */}
          <div className="mb-8">
            <h2
              className="text-2xl sm:text-3xl font-bold tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              Welcome back
            </h2>
            <p
              className="mt-2 text-base"
              style={{ color: 'var(--text-secondary)' }}
            >
              Sign in to continue building your career
            </p>
          </div>

          {/* Google Sign In Button */}
          <motion.button
            whileHover={{ scale: 1.01, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
            whileTap={{ scale: 0.99 }}
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="cursor-pointer w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 dark:bg-[#1f1f1f] dark:hover:bg-[#2a2a2a] border border-gray-200 dark:border-[#333] text-gray-700 dark:text-gray-200 px-5 py-4 rounded-2xl font-medium transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <motion.div
                className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Continue with Google
          </motion.button>

          {/* Divider */}
          <div className="mt-8 flex items-center gap-3">
            <div className="flex-1 h-px bg-[var(--border-color)]" />
            <span className="text-xs font-medium tracking-wider uppercase" style={{ color: 'var(--text-tertiary)' }}>
              Why ResuGPT?
            </span>
            <div className="flex-1 h-px bg-[var(--border-color)]" />
          </div>

          {/* Trust signals */}
          <div className="mt-6 space-y-3">
            {[
              { text: 'Free credits to get started — no card required', icon: '✦' },
              { text: 'AI tailors every document to the job description', icon: '✦' },
              { text: 'Export as polished, ATS-friendly PDFs', icon: '✦' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <span className="text-[var(--accent-color)] text-xs font-bold">{item.icon}</span>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {item.text}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Terms */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mt-8 text-center text-xs leading-relaxed"
            style={{ color: 'var(--text-tertiary)' }}
          >
            By continuing, you agree to our{' '}
            <a
              href="#"
              className="underline underline-offset-2 hover:opacity-80 transition-opacity"
              style={{ color: 'var(--text-secondary)' }}
            >
              Terms of Service
            </a>
            {' '}and{' '}
            <a
              href="#"
              className="underline underline-offset-2 hover:opacity-80 transition-opacity"
              style={{ color: 'var(--text-secondary)' }}
            >
              Privacy Policy
            </a>
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}

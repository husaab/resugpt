'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const productLinks = [
  { label: 'Resume Builder', href: '/' },
  { label: 'Cover Letters', href: '/cover-letter' },
  { label: 'Interview Prep', href: '/interview-prep' },
  { label: 'Application Q&A', href: '/application-qa/new' },
]

const resourceLinks = [
  { label: 'Pricing', href: '/pricing' },
  { label: 'My Resumes', href: '/resumes' },
  { label: 'My Cover Letters', href: '/cover-letters' },
  { label: 'Settings', href: '/settings' },
]

const legalLinks = [
  { label: 'Terms of Service', href: '#' },
  { label: 'Privacy Policy', href: '#' },
]

function FooterLinkGroup({
  title,
  links,
}: {
  title: string
  links: { label: string; href: string }[]
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold tracking-wide text-[var(--text-primary)] mb-4">
        {title}
      </h3>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-color)] transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Footer() {
  const pathname = usePathname()

  // Hide footer on auth page (full-bleed split layout)
  if (pathname === '/auth') return null

  return (
    <footer className="border-t border-[var(--border-color)] bg-[var(--bg-body)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="py-12 md:py-16">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand column */}
            <div className="col-span-2 sm:col-span-1">
              <Link href="/" className="inline-flex items-center gap-2.5 group">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2.5"
                >
                  <div className="w-8 h-8 rounded-lg bg-[var(--accent-color)] flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <span className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
                    Resu<span className="text-[var(--accent-color)]">GPT</span>
                  </span>
                </motion.div>
              </Link>
              <p className="mt-3 text-sm text-[var(--text-tertiary)] leading-relaxed max-w-xs">
                AI-powered resumes, cover letters, and interview prep to land your dream job.
              </p>

              {/* Contact */}
              <motion.a
                href="mailto:support@resugpt.com"
                className="inline-flex items-center gap-2 mt-4 text-sm text-[var(--text-secondary)] hover:text-[var(--accent-color)] transition-colors"
                whileHover={{ x: 2 }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                support@resugpt.com
              </motion.a>
            </div>

            {/* Product links */}
            <FooterLinkGroup title="Product" links={productLinks} />

            {/* Resource links */}
            <FooterLinkGroup title="Account" links={resourceLinks} />

            {/* Legal links */}
            <FooterLinkGroup title="Legal" links={legalLinks} />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-6 border-t border-[var(--border-color)] flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-[var(--text-tertiary)]">
            &copy; {new Date().getFullYear()} ResuGPT. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/auth"
              className="text-xs text-[var(--text-secondary)] hover:text-[var(--accent-color)] transition-colors font-medium"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

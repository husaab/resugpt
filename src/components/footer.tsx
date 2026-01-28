'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-[var(--border-color)] bg-[var(--bg-body)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-12">
          {/* Main content: Brand left, Contact right */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            {/* Brand section */}
            <div className="text-center sm:text-left">
              <Link href="/" className="inline-flex items-center gap-2.5 group">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2.5"
                >
                  {/* Logo icon */}
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
              <p className="mt-2 text-sm text-[var(--text-tertiary)]">
                AI-powered resumes & cover letters
              </p>
            </div>

            {/* Contact Us section */}
            <div className="text-center sm:text-right">
              <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-1">
                Contact Us
              </h3>
              <motion.a
                href="mailto:support@resugpt.com"
                className="inline-flex items-center gap-2 text-[var(--accent-color)] hover:underline text-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                support@resugpt.com
              </motion.a>
            </div>
          </div>

          {/* Copyright divider and text */}
          <div className="mt-8 pt-6 border-t border-[var(--border-color)]">
            <p className="text-xs text-[var(--text-tertiary)] text-center">
              © {new Date().getFullYear()} ResuGPT. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

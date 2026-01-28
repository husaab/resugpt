'use client'

import { StaggerContainer, StaggerItem } from '@/components/motion/stagger-container'
import { CoverLetterForm } from '@/components/CoverLetterForm'

export function CoverLetterHeroSection() {
  return (
    <section className="pt-24 pb-8 md:pt-28 md:pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <StaggerContainer staggerDelay={0.1} className="space-y-5">
          {/* Headline */}
          <StaggerItem>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1]">
              <span style={{ color: 'var(--text-primary)' }}>Generate</span>
              <br />
              <span
                className="bg-gradient-to-r from-[var(--accent-color)] to-[var(--accent-hover)] bg-clip-text text-transparent"
              >
                Cover Letters
              </span>
              <span style={{ color: 'var(--text-primary)' }}> with AI</span>
            </h1>
          </StaggerItem>

          {/* Subheadline */}
          <StaggerItem>
            <p
              className="text-base sm:text-lg md:text-xl max-w-xl mx-auto leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              Upload your resume and job details. Our AI crafts a personalized
              cover letter that highlights your relevant experience.
            </p>
          </StaggerItem>
        </StaggerContainer>
      </div>

      {/* Cover Letter Form */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <CoverLetterForm />
      </div>
    </section>
  )
}

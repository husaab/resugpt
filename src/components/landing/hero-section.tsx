'use client'

import { StaggerContainer, StaggerItem } from '@/components/motion/stagger-container'
import { ResumeForm } from '@/components/ResumeForm'

export function HeroSection() {
  return (
    <section className="pt-24 pb-8 md:pt-28 md:pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <StaggerContainer staggerDelay={0.1} className="space-y-5">
          {/* Headline */}
          <StaggerItem>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1]">
              <span style={{ color: 'var(--text-primary)' }}>Create Perfect</span>
              <br />
              <span
                className="bg-gradient-to-r from-[var(--accent-color)] to-[var(--accent-hover)] bg-clip-text text-transparent"
              >
                Resumes
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
              Upload your resume and job description. Our AI tailors your experience
              to match what employers are looking for.
            </p>
          </StaggerItem>
        </StaggerContainer>
      </div>

      {/* Resume Form - Immediately visible */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <ResumeForm />
      </div>
    </section>
  )
}

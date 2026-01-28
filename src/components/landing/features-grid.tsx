'use client'

import { FeatureCard } from './feature-card'
import { StaggerContainer, StaggerItem } from '@/components/motion/stagger-container'
import { FadeIn } from '@/components/motion/fade-in'

const features = [
  {
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
      </svg>
    ),
    title: 'Upload Your Resume',
    description:
      'Simply upload your existing resume in PDF format. Our AI analyzes and understands your unique background and experience.',
  },
  {
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
    title: 'Add Job Details',
    description:
      'Paste the job description or requirements. Our AI identifies key skills, qualifications, and keywords to target.',
  },
  {
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
    title: 'Get AI Results',
    description:
      'Receive a professionally tailored resume optimized for the specific job opportunity. Stand out from the competition.',
  },
]

export function FeaturesGrid() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <FadeIn className="text-center mb-16">
          <h2
            className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            How It Works
          </h2>
          <p
            className="text-lg max-w-2xl mx-auto"
            style={{ color: 'var(--text-secondary)' }}
          >
            Three simple steps to transform your resume and land your dream job
          </p>
        </FadeIn>

        {/* Feature cards */}
        <StaggerContainer className="grid md:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <StaggerItem key={index}>
              <FeatureCard
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}

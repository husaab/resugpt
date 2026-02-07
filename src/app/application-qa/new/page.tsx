import { ApplicationQAHeroSection } from '@/components/landing/application-qa-hero-section'
import { BackgroundGradient } from '@/components/shared/background-gradient'

export default function ApplicationQANewPage() {
  return (
    <div className="min-h-screen relative">
      <BackgroundGradient />

      {/* Hero Section with Application Q&A Form */}
      <ApplicationQAHeroSection />
    </div>
  )
}

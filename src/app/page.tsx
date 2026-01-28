import { HeroSection } from '@/components/landing/hero-section'
import { FeaturesGrid } from '@/components/landing/features-grid'
import { BackgroundGradient } from '@/components/shared/background-gradient'
import { PastResumesPreview } from '@/components/resumes'

export default function Home() {
  return (
    <div className="min-h-screen relative">
      <BackgroundGradient />

      {/* Hero Section with Resume Form */}
      <HeroSection />

      {/* Past Resumes Preview (for logged-in users) */}
      <PastResumesPreview />

      {/* Features Grid */}
      <FeaturesGrid />
    </div>
  )
}

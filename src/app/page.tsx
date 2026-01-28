import { HeroSection } from '@/components/landing/hero-section'
import { FeaturesGrid } from '@/components/landing/features-grid'
import { BackgroundGradient } from '@/components/shared/background-gradient'

export default function Home() {
  return (
    <div className="min-h-screen relative">
      <BackgroundGradient />

      {/* Hero Section with Resume Form */}
      <HeroSection />

      {/* Features Grid */}
      <FeaturesGrid />
    </div>
  )
}

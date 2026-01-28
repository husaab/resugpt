import { CoverLetterHeroSection } from '@/components/landing/cover-letter-hero-section'
import { BackgroundGradient } from '@/components/shared/background-gradient'

export default function CoverLetterPage() {
  return (
    <div className="min-h-screen relative">
      <BackgroundGradient />

      {/* Hero Section with Cover Letter Form */}
      <CoverLetterHeroSection />
    </div>
  )
}

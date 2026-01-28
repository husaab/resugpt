'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { BackgroundGradient } from '@/components/shared/background-gradient'
import { StaggerContainer, StaggerItem } from '@/components/motion/stagger-container'
import { FadeIn } from '@/components/motion/fade-in'
import { PricingCard } from '@/components/pricing/PricingCard'
import { BillingToggle } from '@/components/pricing/BillingToggle'
import {
  PRICING_TIERS,
  BillingPeriod,
  SubscriptionTier,
  getAnnualSavings,
  formatPrice,
} from '@/lib/pricing'

const CheckIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="var(--success)"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 13l4 4L19 7"
    />
  </svg>
)

export default function PricingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Calculate savings for the Pro tier (most meaningful comparison)
  const proTier = PRICING_TIERS.find((t) => t.id === 'pro')
  const annualSavings = proTier ? getAnnualSavings(proTier.monthlyPrice) : 0

  // Get current user's subscription tier
  const currentTier =
    (session?.user?.subscriptionStatus as SubscriptionTier) || 'free'

  const handleSelectPlan = (tierId: string) => {
    // If not logged in, redirect to auth
    if (!session) {
      router.push(`/auth?redirect=/pricing&tier=${tierId}`)
      return
    }

    // If selecting current plan, do nothing
    if (tierId === currentTier) {
      return
    }

    // TODO: Integrate with Stripe checkout
    // For now, log the selection
    console.log('Plan selected:', {
      tier: tierId,
      billingPeriod,
      userId: session.user?.googleId,
    })

    // Placeholder: Show alert (replace with Stripe checkout)
    alert(
      `Upgrade to ${tierId} (${billingPeriod}) - Stripe integration coming soon!`
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <BackgroundGradient />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <FadeIn className="text-center mb-12">
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            Simple, Transparent Pricing
          </h1>
          <p
            className="text-base sm:text-lg max-w-2xl mx-auto mb-8"
            style={{ color: 'var(--text-secondary)' }}
          >
            Choose the plan that fits your job search. Upgrade or downgrade anytime.
          </p>

          {/* Billing Period Toggle */}
          <BillingToggle
            selected={billingPeriod}
            onChange={setBillingPeriod}
            savingsText={`Save ${formatPrice(annualSavings)} per year`}
          />
        </FadeIn>

        {/* Pricing Cards Grid */}
        <StaggerContainer
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto"
          staggerDelay={0.1}
        >
          {PRICING_TIERS.map((tier) => (
            <StaggerItem key={tier.id}>
              <PricingCard
                tier={tier}
                billingPeriod={billingPeriod}
                onSelect={handleSelectPlan}
                isCurrentPlan={mounted && tier.id === currentTier}
              />
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Trust Badges / FAQ Section */}
        <FadeIn className="mt-16 text-center" delay={0.3}>
          <div className="max-w-3xl mx-auto">
            {/* Trust Points */}
            <div
              className="flex flex-wrap justify-center gap-6 mb-8 text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              <div className="flex items-center gap-2">
                <CheckIcon />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon />
                <span>Secure payment via Stripe</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon />
                <span>Instant access</span>
              </div>
            </div>

            {/* FAQ Teaser */}
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Questions?{' '}
              <a
                href="mailto:support@resugpt.com"
                className="underline hover:no-underline"
                style={{ color: 'var(--accent-color)' }}
              >
                Contact us
              </a>{' '}
              — we&apos;re happy to help.
            </p>
          </div>
        </FadeIn>
      </div>
    </div>
  )
}

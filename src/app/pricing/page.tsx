'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
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

function PricingContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly')
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle checkout cancelled - show message
  useEffect(() => {
    if (searchParams.get('checkout') === 'cancelled') {
      setError('Checkout was cancelled. You can try again when ready.')
      // Clear the URL param
      router.replace('/pricing', { scroll: false })
    }
  }, [searchParams, router])

  // Calculate savings for the Pro tier (most meaningful comparison)
  const proTier = PRICING_TIERS.find((t) => t.id === 'pro')
  const annualSavings = proTier ? getAnnualSavings(proTier.monthlyPrice) : 0

  // Get current user's subscription tier
  const currentTier =
    (session?.user?.subscriptionStatus as SubscriptionTier) || 'free'

  const handleSelectPlan = useCallback(async (tierId: string) => {
    // If not logged in, redirect to auth
    if (!session) {
      router.push(`/auth?redirect=/pricing&tier=${tierId}`)
      return
    }

    // If selecting current plan, do nothing
    if (tierId === currentTier) {
      return
    }

    // Free tier doesn't need checkout
    if (tierId === 'free') {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tier: tierId,
          billingPeriod,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error('Checkout error:', err)
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsLoading(false)
    }
  }, [session, currentTier, billingPeriod, router])

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

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 rounded-lg text-sm"
              style={{
                backgroundColor: 'var(--error-light)',
                color: 'var(--error)',
              }}
            >
              {error}
            </motion.div>
          )}

          {/* Loading Overlay */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              Redirecting to checkout...
            </motion.div>
          )}
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
                disabled={isLoading}
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

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8 text-center">
            <div className="h-12 w-96 mx-auto rounded-lg bg-[var(--bg-muted)]" />
            <div className="h-6 w-64 mx-auto rounded-lg bg-[var(--bg-muted)]" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-96 rounded-2xl bg-[var(--bg-muted)]" />
              ))}
            </div>
          </div>
        </div>
      </div>
    }>
      <PricingContent />
    </Suspense>
  )
}

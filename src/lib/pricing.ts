'use client'

// ==========================================
// PRICING CONFIGURATION
// ==========================================
// Central source of truth for all pricing data.
// Update prices here and they reflect everywhere.
// ==========================================

export type BillingPeriod = 'monthly' | 'annual'
export type SubscriptionTier = 'free' | 'pro' | 'premium'

export interface PricingFeature {
  name: string
  included: boolean
}

export interface PricingTier {
  id: SubscriptionTier
  name: string
  description: string
  monthlyPrice: number
  features: PricingFeature[]
  highlighted?: boolean
  ctaText: string
}

// Annual discount: 2 months free (pay for 10 months)
export const ANNUAL_MONTHS = 10

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Get started with the basics',
    monthlyPrice: 0,
    features: [
      { name: '3 resume credits', included: true },
      { name: '3 cover letter credits', included: true },
      { name: 'Saved resumes on profile', included: true },
      { name: 'Priority support', included: false },
      { name: 'Advanced templates', included: false },
    ],
    ctaText: 'Get Started',
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For serious job seekers',
    monthlyPrice: 4.99,
    features: [
      { name: '30 resume credits', included: true },
      { name: 'Unlimited cover letters', included: true },
      { name: 'Saved resumes on profile', included: true },
      { name: 'Priority support', included: false },
      { name: 'Advanced templates', included: false },
    ],
    highlighted: true,
    ctaText: 'Upgrade to Pro',
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Maximum power, no limits',
    monthlyPrice: 13.99,
    features: [
      { name: 'Unlimited resume credits', included: true },
      { name: 'Unlimited cover letters', included: true },
      { name: 'Saved resumes on profile', included: true },
      { name: 'Priority support', included: true },
      { name: 'Advanced templates', included: true },
    ],
    ctaText: 'Go Premium',
  },
]

// ==========================================
// PRICING UTILITIES
// ==========================================

export function formatPrice(price: number): string {
  if (price === 0) return 'Free'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(price)
}

export function getAnnualPrice(monthlyPrice: number): number {
  return monthlyPrice * ANNUAL_MONTHS
}

export function getAnnualSavings(monthlyPrice: number): number {
  // Savings = 2 months worth (12 - 10 = 2)
  return monthlyPrice * (12 - ANNUAL_MONTHS)
}

export function getDisplayPrice(tier: PricingTier, billingPeriod: BillingPeriod): string {
  if (tier.monthlyPrice === 0) return 'Free'

  if (billingPeriod === 'annual') {
    const annualTotal = getAnnualPrice(tier.monthlyPrice)
    return formatPrice(annualTotal)
  }

  return formatPrice(tier.monthlyPrice)
}

export function getPriceLabel(billingPeriod: BillingPeriod, isFreeTier: boolean): string {
  if (isFreeTier) return 'forever'
  return billingPeriod === 'annual' ? '/year' : '/month'
}

export function getTierById(id: SubscriptionTier): PricingTier | undefined {
  return PRICING_TIERS.find(tier => tier.id === id)
}

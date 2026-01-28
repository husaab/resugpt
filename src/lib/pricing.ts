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
  annualPrice: number // Explicit annual price
  features: PricingFeature[]
  highlighted?: boolean
  ctaText: string
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Get started with the basics',
    monthlyPrice: 0,
    annualPrice: 0,
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
    annualPrice: 40,
    features: [
      { name: '50 resume credits/month', included: true },
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
    annualPrice: 100,
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
    minimumFractionDigits: price % 1 === 0 ? 0 : 2, // No decimals for whole numbers
  }).format(price)
}

export function getAnnualSavings(tier: PricingTier): number {
  // Savings = (monthly * 12) - annual price
  return (tier.monthlyPrice * 12) - tier.annualPrice
}

export function getDisplayPrice(tier: PricingTier, billingPeriod: BillingPeriod): string {
  if (tier.monthlyPrice === 0) return 'Free'

  if (billingPeriod === 'annual') {
    return formatPrice(tier.annualPrice)
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

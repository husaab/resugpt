import Stripe from 'stripe'
import { SubscriptionTier } from './pricing'

// Initialize Stripe with the secret key (server-side only)
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover',
  typescript: true,
})

// Price IDs from Stripe Dashboard - mapped by tier and billing period
export const STRIPE_PRICE_IDS = {
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY!,
    annual: process.env.STRIPE_PRICE_PRO_ANNUAL!,
  },
  premium: {
    monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY!,
    annual: process.env.STRIPE_PRICE_PREMIUM_ANNUAL!,
  },
} as const

// Credits allocation per tier - resets monthly
export const TIER_CREDITS: Record<SubscriptionTier, number> = {
  free: 3,
  pro: 30,
  premium: 999,
}

// Map Stripe Price ID back to tier
export function getTierFromPriceId(priceId: string): SubscriptionTier | null {
  if (
    priceId === STRIPE_PRICE_IDS.pro.monthly ||
    priceId === STRIPE_PRICE_IDS.pro.annual
  ) {
    return 'pro'
  }
  if (
    priceId === STRIPE_PRICE_IDS.premium.monthly ||
    priceId === STRIPE_PRICE_IDS.premium.annual
  ) {
    return 'premium'
  }
  return null
}

// Get the Stripe Price ID for a tier and billing period
export function getPriceId(
  tier: Exclude<SubscriptionTier, 'free'>,
  billingPeriod: 'monthly' | 'annual'
): string {
  return STRIPE_PRICE_IDS[tier][billingPeriod]
}

// Type guard for valid paid tiers
export function isPaidTier(tier: string): tier is Exclude<SubscriptionTier, 'free'> {
  return tier === 'pro' || tier === 'premium'
}

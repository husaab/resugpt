import Stripe from 'stripe'
import { SubscriptionTier } from './pricing'

// Determine if we're in test mode
const isTestMode = process.env.STRIPE_MODE === 'test'

// Get the appropriate keys based on mode
const secretKey = isTestMode
  ? process.env.STRIPE_TEST_SECRET_KEY
  : process.env.STRIPE_LIVE_SECRET_KEY

// Initialize Stripe with the secret key (server-side only)
if (!secretKey) {
  console.warn(`Stripe ${isTestMode ? 'test' : 'live'} secret key is not set`)
}

export const stripe = secretKey
  ? new Stripe(secretKey, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    })
  : null

// Price IDs from Stripe Dashboard - mapped by tier and billing period
export const STRIPE_PRICE_IDS = {
  pro: {
    monthly: isTestMode
      ? process.env.STRIPE_TEST_PRICE_PRO_MONTHLY!
      : process.env.STRIPE_LIVE_PRICE_PRO_MONTHLY!,
    annual: isTestMode
      ? process.env.STRIPE_TEST_PRICE_PRO_ANNUAL!
      : process.env.STRIPE_LIVE_PRICE_PRO_ANNUAL!,
  },
  premium: {
    monthly: isTestMode
      ? process.env.STRIPE_TEST_PRICE_PREMIUM_MONTHLY!
      : process.env.STRIPE_LIVE_PRICE_PREMIUM_MONTHLY!,
    annual: isTestMode
      ? process.env.STRIPE_TEST_PRICE_PREMIUM_ANNUAL!
      : process.env.STRIPE_LIVE_PRICE_PREMIUM_ANNUAL!,
  },
} as const

// Credits allocation per tier - resets monthly
export const TIER_CREDITS: Record<SubscriptionTier, number> = {
  free: 3,
  pro: 50,
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

// Export test mode status for client components
export const STRIPE_TEST_MODE = isTestMode

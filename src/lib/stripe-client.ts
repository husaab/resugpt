'use client'

import { loadStripe, Stripe } from '@stripe/stripe-js'

// Determine if we're in test mode (client-side check)
const isTestMode = process.env.NEXT_PUBLIC_STRIPE_MODE === 'test'

// Get the appropriate publishable key based on mode
const publishableKey = isTestMode
  ? process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY
  : process.env.NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY

// Singleton promise to avoid loading Stripe multiple times
let stripePromise: Promise<Stripe | null> | null = null

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise && publishableKey) {
    stripePromise = loadStripe(publishableKey)
  }
  return stripePromise || Promise.resolve(null)
}

// Export for components that need to know the mode
export const isStripeTestMode = isTestMode

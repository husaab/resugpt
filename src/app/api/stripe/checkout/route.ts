import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { stripe, getPriceId, isPaidTier } from '@/lib/stripe'
import { BillingPeriod } from '@/lib/pricing'

interface CheckoutRequestBody {
  tier: string
  billingPeriod: BillingPeriod
}

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'You must be logged in to upgrade' },
        { status: 401 }
      )
    }

    const body: CheckoutRequestBody = await request.json()
    const { tier, billingPeriod } = body

    // Validate tier
    if (!isPaidTier(tier)) {
      return NextResponse.json(
        { error: 'Invalid subscription tier' },
        { status: 400 }
      )
    }

    // Validate billing period
    if (billingPeriod !== 'monthly' && billingPeriod !== 'annual') {
      return NextResponse.json(
        { error: 'Invalid billing period' },
        { status: 400 }
      )
    }

    // Find or create Stripe customer by email
    const existingCustomers = await stripe.customers.list({
      email: session.user.email,
      limit: 1,
    })

    let customerId: string
    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id
    } else {
      const customer = await stripe.customers.create({
        email: session.user.email,
        name: session.user.name || undefined,
        metadata: {
          // Store the googleId (from our session) for webhook handlers
          googleId: (session.user as { googleId?: string }).googleId || '',
        },
      })
      customerId = customer.id
    }

    // Get the price ID for this tier and billing period
    const priceId = getPriceId(tier, billingPeriod)

    // Create the checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        googleId: (session.user as { googleId?: string }).googleId || '',
        tier,
        billingPeriod,
      },
      success_url: `${process.env.NEXTAUTH_URL}settings?checkout=success`,
      cancel_url: `${process.env.NEXTAUTH_URL}pricing?checkout=cancelled`,
      subscription_data: {
        metadata: {
          googleId: (session.user as { googleId?: string }).googleId || '',
          tier,
        },
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

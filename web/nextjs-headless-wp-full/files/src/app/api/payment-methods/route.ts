import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { stripe, getOrCreateStripeCustomer } from '@/lib/stripe-server'
import { RateLimitPresets, getClientIdentifier, getRateLimitHeaders } from '@/lib/rate-limit'

// Rate limiter: 5 requests per minute per user/IP (strict for payment method management)
const limiter = RateLimitPresets.strict()

/**
 * GET /api/payment-methods
 * List all payment methods for the authenticated customer
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting check
    const identifier = getClientIdentifier(request)
    const limit = 5

    try {
      await limiter.check(limit, identifier)
    } catch (rateLimitError) {
      const remaining = Math.max(0, limit - limiter.getUsage(identifier))
      const resetTime = Date.now() + 60000 // 1 minute from now

      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          retryAfter: 60
        },
        {
          status: 429,
          headers: getRateLimitHeaders(limit, remaining, resetTime)
        }
      )
    }

    const session = await getServerSession()

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get customerId from session (added by NextAuth)
    const customerId = (session as { customerId?: number }).customerId

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID not found' }, { status: 400 })
    }

    // Get or create Stripe customer
    const stripeCustomer = await getOrCreateStripeCustomer(
      customerId.toString(),
      session.user.email,
      session.user.name || undefined
    )

    // List payment methods
    const paymentMethods = await stripe.paymentMethods.list({
      customer: stripeCustomer.id,
      type: 'card',
    })

    // Get default payment method
    const customer = await stripe.customers.retrieve(stripeCustomer.id)
    const defaultPaymentMethodId =
      typeof customer === 'object' && !customer.deleted
        ? customer.invoice_settings.default_payment_method
        : null

    return NextResponse.json({
      paymentMethods: paymentMethods.data,
      defaultPaymentMethodId,
    })
  } catch (error) {
    console.error('Error fetching payment methods:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/payment-methods
 * Create a SetupIntent for adding a new payment method
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const identifier = getClientIdentifier(request)
    const limit = 5

    try {
      await limiter.check(limit, identifier)
    } catch (rateLimitError) {
      const remaining = Math.max(0, limit - limiter.getUsage(identifier))
      const resetTime = Date.now() + 60000 // 1 minute from now

      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          retryAfter: 60
        },
        {
          status: 429,
          headers: getRateLimitHeaders(limit, remaining, resetTime)
        }
      )
    }

    const session = await getServerSession()

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const customerId = (session as { customerId?: number }).customerId

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID not found' }, { status: 400 })
    }

    // Get or create Stripe customer
    const stripeCustomer = await getOrCreateStripeCustomer(
      customerId.toString(),
      session.user.email,
      session.user.name || undefined
    )

    // Create SetupIntent
    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomer.id,
      payment_method_types: ['card'],
    })

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      customerId: stripeCustomer.id,
    })
  } catch (error) {
    console.error('Error creating setup intent:', error)
    return NextResponse.json(
      { error: 'Failed to create setup intent' },
      { status: 500 }
    )
  }
}

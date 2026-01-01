import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { stripe, getOrCreateStripeCustomer } from '@/lib/stripe-server'
import { formatAmountForStripe } from '@/lib/stripe'
import { RateLimitPresets, getClientIdentifier, getRateLimitHeaders } from '@/lib/rate-limit'

// Rate limiter: 3 payment attempts per minute per user/IP (strict for payment processing)
const limiter = RateLimitPresets.payment()

interface PaymentIntentRequest {
  amount: number // in dollars
  paymentMethodId?: string // optional: use existing payment method
}

/**
 * POST /api/create-payment-intent
 * Create a PaymentIntent for checkout
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting check - CRITICAL for payment processing
    const identifier = getClientIdentifier(request)
    const limit = 3

    try {
      await limiter.check(limit, identifier)
    } catch (rateLimitError) {
      const remaining = Math.max(0, limit - limiter.getUsage(identifier))
      const resetTime = Date.now() + 60000 // 1 minute from now

      return NextResponse.json(
        {
          error: 'Too many payment attempts. Please try again later.',
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

    const body: PaymentIntentRequest = await request.json()
    const { amount, paymentMethodId } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    // Get or create Stripe customer
    const stripeCustomer = await getOrCreateStripeCustomer(
      customerId.toString(),
      session.user.email,
      session.user.name || undefined
    )

    // Create PaymentIntent
    const paymentIntentParams: {
      amount: number
      currency: string
      customer: string
      payment_method?: string
      confirm?: boolean
      automatic_payment_methods?: { enabled: boolean }
      metadata: Record<string, string>
    } = {
      amount: formatAmountForStripe(amount),
      currency: 'usd',
      customer: stripeCustomer.id,
      metadata: {
        woocommerce_customer_id: customerId.toString(),
      },
    }

    // If payment method provided, use it and confirm immediately
    if (paymentMethodId) {
      paymentIntentParams.payment_method = paymentMethodId
      paymentIntentParams.confirm = true // Automatically confirm the payment
    } else {
      // Enable automatic payment methods for new cards
      paymentIntentParams.automatic_payment_methods = { enabled: true }
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams)

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      paymentIntent: paymentIntent, // Return full payment intent for status checking
    })
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}

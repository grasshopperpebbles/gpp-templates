import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { stripe, getOrCreateStripeCustomer } from '@/lib/stripe-server'

/**
 * POST /api/payment-methods/[id]/default
 * Set a payment method as the default for the customer
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const customerId = (session as { customerId?: number }).customerId

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID not found' }, { status: 400 })
    }

    const { id: paymentMethodId } = await params

    // Get Stripe customer
    const stripeCustomer = await getOrCreateStripeCustomer(
      customerId.toString(),
      session.user.email,
      session.user.name || undefined
    )

    // Update customer's default payment method
    await stripe.customers.update(stripeCustomer.id, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error setting default payment method:', error)
    return NextResponse.json(
      { error: 'Failed to set default payment method' },
      { status: 500 }
    )
  }
}

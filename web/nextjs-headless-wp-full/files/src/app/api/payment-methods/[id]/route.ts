import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { stripe } from '@/lib/stripe-server'

/**
 * DELETE /api/payment-methods/[id]
 * Detach a payment method from the customer
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Detach payment method
    await stripe.paymentMethods.detach(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error detaching payment method:', error)
    return NextResponse.json(
      { error: 'Failed to detach payment method' },
      { status: 500 }
    )
  }
}

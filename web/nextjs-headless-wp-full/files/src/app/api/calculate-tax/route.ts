import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { calculateSimpleTax } from '@/lib/tax-service'
import { RateLimitPresets, getClientIdentifier, getRateLimitHeaders } from '@/lib/rate-limit'

// Rate limiter: 10 requests per minute per user/IP (standard for tax calculations)
const limiter = RateLimitPresets.standard()

/**
 * POST /api/calculate-tax
 *
 * Calculate sales tax based on subtotal and shipping address
 *
 * Request body:
 * {
 *   subtotal: number,
 *   shippingAddress: {
 *     line1: string,
 *     line2?: string,
 *     city: string,
 *     state: string,
 *     postalCode: string,
 *     country: string
 *   }
 * }
 *
 * Response:
 * {
 *   taxAmount: number,
 *   taxRate: number
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const identifier = getClientIdentifier(request)
    const limit = 10

    try {
      await limiter.check(limit, identifier)
    } catch (rateLimitError) {
      const remaining = Math.max(0, limit - limiter.getUsage(identifier))
      const resetTime = Date.now() + 60000 // 1 minute from now

      return NextResponse.json(
        {
          error: 'Too many tax calculation requests. Please try again later.',
          retryAfter: 60
        },
        {
          status: 429,
          headers: getRateLimitHeaders(limit, remaining, resetTime)
        }
      )
    }

    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { subtotal, shippingAddress } = body

    // Validate required fields
    if (!subtotal || !shippingAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: subtotal, shippingAddress' },
        { status: 400 }
      )
    }

    // Validate address fields
    if (
      !shippingAddress.line1 ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.postalCode ||
      !shippingAddress.country
    ) {
      return NextResponse.json(
        { error: 'Incomplete shipping address' },
        { status: 400 }
      )
    }

    // Calculate tax using Stripe Tax
    const result = await calculateSimpleTax(subtotal, {
      line1: shippingAddress.line1,
      line2: shippingAddress.line2,
      city: shippingAddress.city,
      state: shippingAddress.state,
      postalCode: shippingAddress.postalCode,
      country: shippingAddress.country,
    })

    return NextResponse.json({
      taxAmount: result.taxAmount,
      taxRate: result.taxRate,
    })
  } catch (error) {
    console.error('Error calculating tax:', error)
    return NextResponse.json(
      { error: 'Failed to calculate tax' },
      { status: 500 }
    )
  }
}

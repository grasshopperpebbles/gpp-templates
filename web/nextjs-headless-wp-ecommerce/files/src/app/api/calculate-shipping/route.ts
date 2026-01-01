import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { calculateSimpleShipping } from '@/lib/shipping-service'
import { RateLimitPresets, getClientIdentifier, getRateLimitHeaders } from '@/lib/rate-limit'

// Rate limiter: 10 requests per minute per user/IP (standard for shipping calculations)
const limiter = RateLimitPresets.standard()

/**
 * POST /api/calculate-shipping
 *
 * Calculate shipping rates based on destination address
 *
 * Request body:
 * {
 *   toAddress: {
 *     name: string,
 *     street1: string,
 *     street2?: string,
 *     city: string,
 *     state: string,
 *     zip: string,
 *     country: string
 *   },
 *   totalWeight?: number
 * }
 *
 * Response:
 * {
 *   rates: ShippingRate[],
 *   cheapestRate: ShippingRate | null,
 *   fastestRate: ShippingRate | null
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
          error: 'Too many shipping calculation requests. Please try again later.',
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
    const { toAddress, totalWeight } = body

    // Validate required fields
    if (!toAddress) {
      return NextResponse.json(
        { error: 'Missing required field: toAddress' },
        { status: 400 }
      )
    }

    // Validate address fields
    if (
      !toAddress.name ||
      !toAddress.street1 ||
      !toAddress.city ||
      !toAddress.state ||
      !toAddress.zip ||
      !toAddress.country
    ) {
      return NextResponse.json(
        { error: 'Incomplete shipping address' },
        { status: 400 }
      )
    }

    // Calculate shipping rates using Shippo
    const result = await calculateSimpleShipping(
      {
        name: toAddress.name,
        street1: toAddress.street1,
        street2: toAddress.street2,
        city: toAddress.city,
        state: toAddress.state,
        zip: toAddress.zip,
        country: toAddress.country,
      },
      totalWeight || 2 // Default to 2 pounds if not provided
    )

    return NextResponse.json({
      rates: result.rates,
      cheapestRate: result.cheapestRate,
      fastestRate: result.fastestRate,
    })
  } catch (error) {
    console.error('Error calculating shipping:', error)
    return NextResponse.json(
      { error: 'Failed to calculate shipping' },
      { status: 500 }
    )
  }
}

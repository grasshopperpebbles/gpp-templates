import { NextRequest, NextResponse } from 'next/server'
import { RateLimitPresets, getClientIdentifier, getRateLimitHeaders } from '@/lib/rate-limit'

const WC_API_URL = process.env.NEXT_PUBLIC_WP_API_URL || 'http://localhost:8080/wp-json/wc/v3'
const WC_CONSUMER_KEY = process.env.WC_CONSUMER_KEY || ''
const WC_CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET || ''

// Rate limiter: 10 review submissions per minute per user/IP
const limiter = RateLimitPresets.standard()

interface ReviewSubmitRequest {
  productId: number // WooCommerce database ID
  rating: number
  content: string
  title?: string
  authorName: string
  authorEmail: string
}

interface WooCommerceReview {
  id: number
  date_created: string
  date_created_gmt: string
  product_id: number
  status: string
  reviewer: string
  reviewer_email: string
  review: string
  rating: number
  verified: boolean
  reviewer_avatar_urls: {
    '24': string
    '48': string
    '96': string
  }
}

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
          error: 'Too many review submissions. Please try again later.',
          retryAfter: 60
        },
        {
          status: 429,
          headers: getRateLimitHeaders(limit, remaining, resetTime)
        }
      )
    }

    const body: ReviewSubmitRequest = await request.json()

    // Validate required fields
    if (!body.productId || !body.rating || !body.content || !body.authorName || !body.authorEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate rating is between 1 and 5
    if (body.rating < 1 || body.rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Prepare review content (combine title and content if title exists)
    const reviewContent = body.title
      ? `${body.title}\n\n${body.content}`
      : body.content

    // Build WooCommerce API URL with authentication
    const url = new URL(`${WC_API_URL}/products/reviews`)
    url.searchParams.append('consumer_key', WC_CONSUMER_KEY)
    url.searchParams.append('consumer_secret', WC_CONSUMER_SECRET)

    // Submit review to WooCommerce
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: body.productId,
        review: reviewContent,
        reviewer: body.authorName,
        reviewer_email: body.authorEmail,
        rating: body.rating,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('WooCommerce API error:', response.status, errorText)

      // Parse error message if possible
      try {
        const errorData = JSON.parse(errorText)
        return NextResponse.json(
          { error: errorData.message || 'Failed to submit review' },
          { status: response.status }
        )
      } catch {
        return NextResponse.json(
          { error: 'Failed to submit review to WooCommerce' },
          { status: response.status }
        )
      }
    }

    const review: WooCommerceReview = await response.json()

    return NextResponse.json({
      success: true,
      review: {
        id: review.id,
        productId: review.product_id,
        rating: review.rating,
        content: review.review,
        author: review.reviewer,
        email: review.reviewer_email,
        status: review.status,
        dateCreated: review.date_created,
      },
    })
  } catch (error) {
    console.error('Review submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

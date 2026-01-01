/**
 * Newsletter Subscription API Route
 *
 * Subscribes email addresses to the newsletter via WordPress GraphQL.
 * POST /api/newsletter/subscribe
 *
 * This is a temporary workaround storing subscribers in WordPress options.
 * Will be replaced with Broadkast.io newsletter service in the future.
 */

import { NextResponse } from 'next/server'

const SUBSCRIBE_MUTATION = `
  mutation SubscribeToNewsletter($email: String!) {
    subscribeToNewsletter(input: { email: $email }) {
      success
      message
    }
  }
`

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Send to WordPress GraphQL
    const response = await fetch(
      process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:8080/graphql',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: SUBSCRIBE_MUTATION,
          variables: { email },
        }),
      }
    )

    const result = await response.json()

    if (result.errors) {
      console.error('GraphQL errors:', result.errors)
      return NextResponse.json(
        { success: false, message: 'Failed to subscribe. Please try again.' },
        { status: 500 }
      )
    }

    const data = result.data?.subscribeToNewsletter

    if (!data) {
      return NextResponse.json(
        { success: false, message: 'Unexpected error. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: data.success,
      message: data.message,
    })
  } catch (error) {
    console.error('Newsletter subscription error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Order Confirmation Email API Route
 *
 * Sends order confirmation email via Resend if enabled in WordPress config.
 * POST /api/email/order-confirmation
 */

import { NextResponse } from 'next/server'
import { sendEmail, isResendConfigured } from '@/lib/email/resend'
import {
  generateOrderConfirmationEmail,
  generateOrderConfirmationText,
  type OrderConfirmationData,
} from '@/lib/email/templates/order-confirmation'

// GraphQL query to get email config from WordPress
const GET_EMAIL_CONFIG = `
  query GetEmailConfig {
    headlessConfig {
      resendEnabled
      resendFromEmail
      resendFromName
      frontendUrl
    }
  }
`

interface EmailConfig {
  resendEnabled: boolean
  resendFromEmail: string
  resendFromName: string
  frontendUrl: string
}

async function getEmailConfig(): Promise<EmailConfig | null> {
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:8080/graphql',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: GET_EMAIL_CONFIG }),
        next: { revalidate: 60 }, // Cache for 60 seconds
      }
    )

    const result = await response.json()

    if (result.errors || !result.data?.headlessConfig) {
      console.error('Failed to fetch email config:', result.errors)
      return null
    }

    return result.data.headlessConfig
  } catch (error) {
    console.error('Error fetching email config:', error)
    return null
  }
}

export async function POST(request: Request) {
  try {
    // Check if Resend API key is configured
    if (!isResendConfigured()) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email service not configured (missing RESEND_API_KEY)',
          skipped: true,
        },
        { status: 200 }
      )
    }

    // Get email config from WordPress
    const config = await getEmailConfig()

    // Check if Resend is enabled in WordPress admin
    if (!config?.resendEnabled) {
      return NextResponse.json(
        {
          success: true,
          message: 'Resend emails disabled in WordPress admin. Stripe receipt will be sent.',
          skipped: true,
        },
        { status: 200 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Validate required fields
    const requiredFields = [
      'orderNumber',
      'customerName',
      'customerEmail',
      'items',
      'subtotal',
      'shipping',
      'tax',
      'total',
      'shippingAddress',
      'paymentMethod',
    ]

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, message: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Build email data
    const emailData: OrderConfirmationData = {
      orderNumber: body.orderNumber,
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      items: body.items,
      subtotal: body.subtotal,
      shipping: body.shipping,
      tax: body.tax,
      total: body.total,
      shippingAddress: body.shippingAddress,
      billingAddress: body.billingAddress || body.shippingAddress,
      paymentMethod: body.paymentMethod,
      orderDate: new Date(body.orderDate || Date.now()),
      estimatedDelivery: body.estimatedDelivery,
      storeName: config.resendFromName || 'Forever Unbothered',
      storeUrl: config.frontendUrl || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3004',
      supportEmail: body.supportEmail,
    }

    // Generate email content
    const html = generateOrderConfirmationEmail(emailData)
    const text = generateOrderConfirmationText(emailData)

    // Send email
    const result = await sendEmail({
      from: config.resendFromEmail || 'orders@foreverunbothered.com',
      fromName: config.resendFromName || 'Forever Unbothered',
      to: body.customerEmail,
      subject: `Order Confirmed - #${body.orderNumber}`,
      html,
      text,
    })

    if (!result.success) {
      console.error('Failed to send order confirmation email:', result.error)
      return NextResponse.json(
        {
          success: false,
          message: result.error || 'Failed to send email',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Order confirmation email sent',
      emailId: result.id,
    })
  } catch (error) {
    console.error('Order confirmation email error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

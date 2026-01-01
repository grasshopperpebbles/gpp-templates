/**
 * Contact Form Submission API Route
 *
 * Sends contact form submissions via Resend email.
 * POST /api/contact/submit
 *
 * This is a temporary workaround sending emails via Resend.
 * Will be replaced with Broadkast.io AI Contact Service in the future.
 */

import { NextResponse } from 'next/server'
import { sendEmail, isResendConfigured } from '@/lib/email/resend'

// Get email config from WordPress
const GET_EMAIL_CONFIG = `
  query GetEmailConfig {
    headlessConfig {
      resendFromEmail
      resendFromName
    }
  }
`

interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
}

async function getEmailConfig() {
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:8080/graphql',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: GET_EMAIL_CONFIG }),
        next: { revalidate: 60 },
      }
    )
    const result = await response.json()
    return result.data?.headlessConfig || null
  } catch {
    return null
  }
}

function generateContactEmailHtml(data: ContactFormData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Contact Form Submission</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">New Contact Form Submission</h1>
  </div>

  <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; width: 100px;">From:</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">${data.name}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Email:</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
          <a href="mailto:${data.email}" style="color: #667eea;">${data.email}</a>
        </td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Subject:</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">${data.subject}</td>
      </tr>
    </table>

    <div style="margin-top: 20px;">
      <h3 style="margin: 0 0 10px 0; color: #374151;">Message:</h3>
      <div style="background: white; padding: 15px; border-radius: 4px; border: 1px solid #e5e7eb; white-space: pre-wrap;">${data.message}</div>
    </div>

    <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 4px; border: 1px solid #f59e0b;">
      <p style="margin: 0; font-size: 14px; color: #92400e;">
        <strong>Reply directly</strong> to this email to respond to the customer.
      </p>
    </div>
  </div>

  <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
    <p style="margin: 0;">This message was sent from the Forever Unbothered website contact form.</p>
  </div>
</body>
</html>
`
}

function generateContactEmailText(data: ContactFormData): string {
  return `
New Contact Form Submission
============================

From: ${data.name}
Email: ${data.email}
Subject: ${data.subject}

Message:
${data.message}

---
Reply directly to this email to respond to the customer.
This message was sent from the Forever Unbothered website contact form.
`
}

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json()
    const { name, email, subject, message } = body as ContactFormData

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
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

    // Check if Resend is configured
    if (!isResendConfigured()) {
      // Fallback: Just log the submission (for development)
      console.log('Contact form submission (Resend not configured):', { name, email, subject, message })
      return NextResponse.json({
        success: true,
        message: 'Thank you for your message! We\'ll get back to you soon.',
        note: 'Email service not configured - submission logged only',
      })
    }

    // Get email config from WordPress
    const config = await getEmailConfig()
    const fromEmail = config?.resendFromEmail || 'noreply@foreverunbothered.com'
    const fromName = config?.resendFromName || 'Forever Unbothered'

    // Business owner email - should be configurable in WordPress
    const businessEmail = process.env.CONTACT_EMAIL || 'support@foreverunbothered.com'

    // Generate email content
    const html = generateContactEmailHtml({ name, email, subject, message })
    const text = generateContactEmailText({ name, email, subject, message })

    // Send email to business owner
    const result = await sendEmail({
      from: fromEmail,
      fromName: fromName,
      to: businessEmail,
      subject: `[Contact Form] ${subject}`,
      html,
      text,
      replyTo: email, // Reply goes to customer
    })

    if (!result.success) {
      console.error('Failed to send contact form email:', result.error)
      // Still return success to user - don't expose email failures
      return NextResponse.json({
        success: true,
        message: 'Thank you for your message! We\'ll get back to you soon.',
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you for your message! We\'ll get back to you soon.',
    })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Something went wrong. Please try again later.',
      },
      { status: 500 }
    )
  }
}

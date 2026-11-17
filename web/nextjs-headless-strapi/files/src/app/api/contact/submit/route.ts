/**
 * Contact Form Submission API Route
 *
 * POST /api/contact/submit
 *
 * Logs the submission with the logger. No email is sent yet.
 */

import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, subject, message } = body as ContactFormData

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email address' },
        { status: 400 }
      )
    }

    logger.info('Contact form submission', { name, email, subject, message })

    // TODO: send this message by email with your provider (Resend, SES, SMTP, ...).

    return NextResponse.json({
      success: true,
      message: 'Thank you for your message! We\'ll get back to you soon.',
    })
  } catch (error) {
    logger.error('Contact form error', error as Error)
    return NextResponse.json(
      {
        success: false,
        message: 'Something went wrong. Please try again later.',
      },
      { status: 500 }
    )
  }
}

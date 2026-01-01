/**
 * Resend Email Service
 *
 * Email sending using Resend (https://resend.com)
 * Set RESEND_API_KEY environment variable to enable.
 */

import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resendClient = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * Check if Resend is configured
 */
export function isResendConfigured(): boolean {
  return !!resendApiKey && !!resendClient;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

/**
 * Send an email using Resend
 *
 * @param options Email options
 * @returns Success boolean and optional error message
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  if (!resendClient) {
    console.warn('Resend not configured. Set RESEND_API_KEY environment variable.');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const fromAddress = options.from || process.env.EMAIL_FROM || 'noreply@example.com';

    await resendClient.emails.send({
      from: fromAddress,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
      reply_to: options.replyTo,
    });

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to send email';
    console.error('Email send error:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

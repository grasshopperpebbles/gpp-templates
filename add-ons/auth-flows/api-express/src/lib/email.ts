/**
 * Email delivery for auth flows (gpp add auth-flows).
 *
 * Providers: console (logs the email, the default outside production), resend and
 * sendgrid (both over HTTPS with fetch, no SDK needed) and ses (needs @aws-sdk/client-ses,
 * which the installer adds to package.json when you pick ses).
 */

export interface Email {
  to: string;
  subject: string;
  html: string;
  text: string;
}

// The provider picked when the add-on was installed; used in production when
// EMAIL_PROVIDER is not set.
const INSTALLED_PROVIDER = '{{EMAIL_PROVIDER}}';
const PROVIDERS = ['console', 'resend', 'sendgrid', 'ses'] as const;
type Provider = (typeof PROVIDERS)[number];

const isProduction = () => process.env.NODE_ENV === 'production';
const emailFrom = () => process.env.EMAIL_FROM || 'noreply@example.com';

/**
 * EMAIL_PROVIDER if set; otherwise "console" outside production and the installed
 * provider in production. NODE_ENV=test always uses "console", so tests never send email.
 */
export function emailProvider(): string {
  if (process.env.NODE_ENV === 'test') return 'console';
  const configured = (process.env.EMAIL_PROVIDER || '').trim().toLowerCase();
  if (configured) return configured;
  return isProduction() ? INSTALLED_PROVIDER : 'console';
}

async function postJson(url: string, apiKey: string, payload: unknown): Promise<void> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`${url} answered ${response.status}: ${await response.text()}`);
  }
}

async function sendResend(email: Email): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY is not set');
  await postJson('https://api.resend.com/emails', apiKey, {
    from: emailFrom(),
    to: [email.to],
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
}

async function sendSendgrid(email: Email): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) throw new Error('SENDGRID_API_KEY is not set');
  await postJson('https://api.sendgrid.com/v3/mail/send', apiKey, {
    personalizations: [{ to: [{ email: email.to }] }],
    from: { email: emailFrom() },
    subject: email.subject,
    content: [
      { type: 'text/plain', value: email.text },
      { type: 'text/html', value: email.html },
    ],
  });
}

async function sendSes(email: Email): Promise<void> {
  // Loaded by name so the app compiles without the package when another provider is used.
  const sesModule = '@aws-sdk/client-ses';
  const { SESClient, SendEmailCommand } = await import(sesModule);
  const client = new SESClient({ region: process.env.AWS_REGION || 'us-east-1' });
  await client.send(
    new SendEmailCommand({
      Source: emailFrom(),
      Destination: { ToAddresses: [email.to] },
      Message: {
        Subject: { Charset: 'UTF-8', Data: email.subject },
        Body: {
          Html: { Charset: 'UTF-8', Data: email.html },
          Text: { Charset: 'UTF-8', Data: email.text },
        },
      },
    })
  );
}

async function sendConsole(email: Email): Promise<void> {
  if (isProduction()) {
    // Never write sign-in links to production logs.
    console.error(`EMAIL_PROVIDER=console in production: email "${email.subject}" to ${email.to} was not sent`);
    return;
  }
  console.log(
    `[auth-flows] console email (set EMAIL_PROVIDER to send real email)\nTo: ${email.to}\nSubject: ${email.subject}\n\n${email.text}`
  );
}

const SENDERS: Record<Provider, (email: Email) => Promise<void>> = {
  console: sendConsole,
  resend: sendResend,
  sendgrid: sendSendgrid,
  ses: sendSes,
};

/** Send one email. Failures are logged, never thrown. */
export async function deliver(email: Email): Promise<boolean> {
  const provider = emailProvider();
  const sender = SENDERS[provider as Provider];
  if (!sender) {
    console.error(`Unknown EMAIL_PROVIDER "${provider}" (use one of ${PROVIDERS.join(', ')})`);
    return false;
  }
  try {
    await sender(email);
    return true;
  } catch (error) {
    console.error(`Sending "${email.subject}" via ${provider} failed:`, error);
    return false;
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function layout(title: string, greeting: string, intro: string, button: string, url: string, outro: string): string {
  const safeUrl = escapeHtml(url);
  return `<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="font-size: 22px;">${escapeHtml(title)}</h1>
  <p>${escapeHtml(greeting)}</p>
  <p>${escapeHtml(intro)}</p>
  <p style="margin: 28px 0;">
    <a href="${safeUrl}" style="background: #111827; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">${escapeHtml(button)}</a>
  </p>
  <p style="color: #666; font-size: 14px;">Or open this link: <a href="${safeUrl}">${safeUrl}</a></p>
  <p style="color: #999; font-size: 12px;">${escapeHtml(outro)}</p>
</body>
</html>`;
}

const appUrl = () => (process.env.APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
const greeting = (name: string | null) => (name ? `Hi ${name},` : 'Hi,');

export async function sendVerificationEmail(to: string, name: string | null, token: string, hours: number): Promise<boolean> {
  const url = `${appUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  const intro = 'Please confirm your email address.';
  const outro = `The link expires in ${hours} hours. If you didn't create an account, ignore this email.`;
  return deliver({
    to,
    subject: 'Verify your email address',
    html: layout('Verify your email', greeting(name), intro, 'Verify email', url, outro),
    text: `${greeting(name)}\n\n${intro}\n\n${url}\n\n${outro}\n`,
  });
}

export async function sendPasswordResetEmail(to: string, name: string | null, token: string, minutes: number): Promise<boolean> {
  const url = `${appUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  const intro = 'We received a request to reset your password.';
  const outro = `The link expires in ${minutes} minutes and works once. If you didn't ask for this, ignore this email; your password stays the same.`;
  return deliver({
    to,
    subject: 'Reset your password',
    html: layout('Reset your password', greeting(name), intro, 'Reset password', url, outro),
    text: `${greeting(name)}\n\n${intro}\n\n${url}\n\n${outro}\n`,
  });
}

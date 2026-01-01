/**
 * Email Service for Auth Flows
 */

// Email provider: resend | sendgrid | ses
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || "{{EMAIL_PROVIDER}}";
const EMAIL_FROM = process.env.EMAIL_FROM || "noreply@example.com";
const APP_URL = process.env.APP_URL || process.env.FRONTEND_URL || "http://localhost:3000";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    switch (EMAIL_PROVIDER) {
      case "resend":
        return await sendWithResend(options);
      case "sendgrid":
        return await sendWithSendGrid(options);
      case "ses":
        return await sendWithSES(options);
      default:
        console.error(`Unknown email provider: ${EMAIL_PROVIDER}`);
        return false;
    }
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

async function sendWithResend(options: EmailOptions): Promise<boolean> {
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });

  if (error) {
    console.error("Resend error:", error);
    return false;
  }

  return true;
}

async function sendWithSendGrid(options: EmailOptions): Promise<boolean> {
  const sgMail = await import("@sendgrid/mail");
  sgMail.default.setApiKey(process.env.SENDGRID_API_KEY || "");

  await sgMail.default.send({
    from: EMAIL_FROM,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text || options.html.replace(/<[^>]*>/g, ""),
  });

  return true;
}

async function sendWithSES(options: EmailOptions): Promise<boolean> {
  const { SESClient, SendEmailCommand } = await import("@aws-sdk/client-ses");

  const client = new SESClient({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
  });

  const command = new SendEmailCommand({
    Source: EMAIL_FROM,
    Destination: { ToAddresses: [options.to] },
    Message: {
      Subject: { Charset: "UTF-8", Data: options.subject },
      Body: {
        Html: { Charset: "UTF-8", Data: options.html },
        ...(options.text && { Text: { Charset: "UTF-8", Data: options.text } }),
      },
    },
  });

  await client.send(command);
  return true;
}

export async function sendVerificationEmail(
  to: string,
  name: string,
  token: string
): Promise<boolean> {
  const verificationUrl = `${APP_URL}/verify-email?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Verify Your Email</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p>Hi ${name},</p>
            <p>Thanks for signing up! Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" style="background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Verify Email</a>
            </div>
            <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
            <p style="color: #667eea; font-size: 14px; word-break: break-all;">${verificationUrl}</p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">This link will expire in 24 hours.</p>
            <p style="color: #999; font-size: 12px; margin-top: 20px;">If you didn't create an account, you can safely ignore this email.</p>
        </div>
    </body>
    </html>
  `;

  const text = `
Hi ${name},

Thanks for signing up! Please verify your email address by clicking the link below:

${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account, you can safely ignore this email.
  `.trim();

  return sendEmail({ to, subject: "Verify Your Email", html, text });
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  token: string
): Promise<boolean> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Reset Your Password</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p>Hi ${name},</p>
            <p>We received a request to reset your password. Click the button below to set a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background: #f5576c; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Reset Password</a>
            </div>
            <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
            <p style="color: #f5576c; font-size: 14px; word-break: break-all;">${resetUrl}</p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">This link will expire in 1 hour.</p>
            <p style="color: #999; font-size: 12px; margin-top: 20px;">If you didn't request a password reset, you can safely ignore this email.</p>
        </div>
    </body>
    </html>
  `;

  const text = `
Hi ${name},

We received a request to reset your password. Click the link below to set a new password:

${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email.
  `.trim();

  return sendEmail({ to, subject: "Reset Your Password", html, text });
}

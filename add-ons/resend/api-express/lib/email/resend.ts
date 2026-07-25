import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY ?? "");

export async function sendTransactionalEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const from = process.env.EMAIL_FROM ?? "noreply@example.com";
  const { error } = await resend.emails.send({ from, ...options });
  if (error) {
    throw new Error(error.message);
  }
}

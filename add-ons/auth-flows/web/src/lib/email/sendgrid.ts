/**
 * SendGrid Email Provider
 * https://sendgrid.com
 */

import sgMail from "@sendgrid/mail";
import type { EmailOptions, EmailProvider } from "./index";

sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");

export const sendgridProvider: EmailProvider = {
  async send(options: EmailOptions) {
    try {
      await sgMail.send({
        from: process.env.EMAIL_FROM || "noreply@example.com",
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ""),
      });

      return { success: true };
    } catch (err) {
      console.error("SendGrid error:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  },
};

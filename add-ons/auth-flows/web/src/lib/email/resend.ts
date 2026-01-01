/**
 * Resend Email Provider
 * https://resend.com
 */

import { Resend } from "resend";
import type { EmailOptions, EmailProvider } from "./index";

const resend = new Resend(process.env.RESEND_API_KEY);

export const resendProvider: EmailProvider = {
  async send(options: EmailOptions) {
    try {
      const { error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || "noreply@example.com",
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      if (error) {
        console.error("Resend error:", error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      console.error("Failed to send email:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  },
};

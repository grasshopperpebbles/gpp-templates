/**
 * AWS SES Email Provider
 * https://aws.amazon.com/ses/
 */

import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import type { EmailOptions, EmailProvider } from "./index";

const sesClient = new SESClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export const sesProvider: EmailProvider = {
  async send(options: EmailOptions) {
    try {
      const command = new SendEmailCommand({
        Source: process.env.EMAIL_FROM || "noreply@example.com",
        Destination: {
          ToAddresses: [options.to],
        },
        Message: {
          Subject: {
            Charset: "UTF-8",
            Data: options.subject,
          },
          Body: {
            Html: {
              Charset: "UTF-8",
              Data: options.html,
            },
            ...(options.text && {
              Text: {
                Charset: "UTF-8",
                Data: options.text,
              },
            }),
          },
        },
      });

      await sesClient.send(command);
      return { success: true };
    } catch (err) {
      console.error("AWS SES error:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  },
};

/**
 * Email Provider Abstraction
 *
 * This file exports the configured email provider based on environment.
 * The provider is selected during `gpp add auth-flows`.
 */

import { {{EMAIL_PROVIDER}}Provider } from "./{{EMAIL_PROVIDER}}";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailProvider {
  send(options: EmailOptions): Promise<{ success: boolean; error?: string }>;
}

// Export the configured provider
export const emailProvider: EmailProvider = {{EMAIL_PROVIDER}}Provider;

// Re-export for convenience
export { {{EMAIL_PROVIDER}}Provider } from "./{{EMAIL_PROVIDER}}";

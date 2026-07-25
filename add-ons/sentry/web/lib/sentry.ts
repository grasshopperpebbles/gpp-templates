const sentryDsn =
  process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN ?? "";

export const sentryEnvironment =
  process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? "development";

export function isSentryConfigured(): boolean {
  return sentryDsn.length > 0;
}

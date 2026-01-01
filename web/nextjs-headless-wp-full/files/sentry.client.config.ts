// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Initialize Sentry with DSN from WordPress config (via window object)
// The DSN is fetched server-side and injected into the page
const sentryDsn = typeof window !== 'undefined'
  ? (window as any).__SENTRY_DSN__
  : process.env.NEXT_PUBLIC_SENTRY_DSN;

const sentryEnvironment = typeof window !== 'undefined'
  ? (window as any).__SENTRY_ENVIRONMENT__
  : process.env.NODE_ENV;

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: sentryEnvironment || 'production',

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: 1,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    replaysOnErrorSampleRate: 1.0,

    // This sets the sample rate to be 10%. You may want this to be 100% while
    // in development and sample at a lower rate in production
    replaysSessionSampleRate: 0.1,

    // You can remove this option if you're not planning to use the Sentry Session Replay feature:
    integrations: [
      Sentry.replayIntegration({
        // Additional Replay configuration goes in here, for example:
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
  });
} else {
  console.warn('Sentry DSN not configured - error tracking disabled');
}

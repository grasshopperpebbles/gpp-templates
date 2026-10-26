import Stripe from 'stripe';

// Server-side Stripe client (added by `gpp add stripe`). STRIPE_SECRET_KEY lives only in the
// API's environment, never in a web, desktop or mobile client. The SDK's pinned API version is used.
let client: Stripe | undefined;
let clientKey = '';

/** The Stripe client for STRIPE_SECRET_KEY; throws when the key is unset. */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim() ?? '';
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  if (!client || clientKey !== key) {
    client = new Stripe(key);
    clientKey = key;
  }
  return client;
}

export const stripePublishableKey =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ??
  process.env.STRIPE_PUBLISHABLE_KEY ??
  "";

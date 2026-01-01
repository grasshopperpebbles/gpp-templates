import { loadStripe, Stripe } from '@stripe/stripe-js'

let stripePromise: Promise<Stripe | null>

/**
 * Get Stripe.js instance (client-side only)
 * Loads Stripe with the publishable key
 */
export const getStripe = () => {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    if (!key) {
      throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined')
    }
    stripePromise = loadStripe(key)
  }
  return stripePromise
}

/**
 * Format amount for Stripe (convert dollars to cents)
 * Stripe uses the smallest currency unit (cents for USD)
 */
export const formatAmountForStripe = (amount: number): number => {
  return Math.round(amount * 100)
}

/**
 * Format amount from Stripe (convert cents to dollars)
 */
export const formatAmountFromStripe = (amount: number): number => {
  return amount / 100
}

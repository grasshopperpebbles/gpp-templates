import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined')
}

/**
 * Server-side Stripe instance
 * Only use this in API routes or server components
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-10-29.clover',
  typescript: true,
})

/**
 * Get or create a Stripe customer for a WooCommerce customer
 */
export async function getOrCreateStripeCustomer(
  customerId: string,
  email: string,
  name?: string
): Promise<Stripe.Customer> {
  // Check if customer already has a Stripe customer ID in metadata
  // In production, this would be stored in WooCommerce customer meta

  // For now, search by email
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  })

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0]
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      woocommerce_customer_id: customerId,
    },
  })

  return customer
}

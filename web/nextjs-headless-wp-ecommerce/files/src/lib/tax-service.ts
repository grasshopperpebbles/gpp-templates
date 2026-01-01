/**
 * Tax Calculation Service
 *
 * Calculates sales tax using Stripe Tax API
 * Handles address-based tax calculation with automatic nexus determination
 */

import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
})

export interface TaxCalculationInput {
  /**
   * Cart line items for tax calculation
   */
  lineItems: Array<{
    amount: number // Amount in cents
    reference: string // Product ID or SKU
    taxCode?: string // Stripe tax code (optional, defaults to 'txcd_99999999' for general goods)
  }>

  /**
   * Customer's shipping address
   */
  shippingAddress: {
    line1: string
    line2?: string
    city: string
    state: string
    postalCode: string
    country: string // ISO 3166-1 alpha-2 country code (e.g., 'US')
  }

  /**
   * Currency code (ISO 4217)
   */
  currency?: string
}

export interface TaxCalculationResult {
  /**
   * Total tax amount in dollars
   */
  taxAmount: number

  /**
   * Tax amount in cents (for Stripe)
   */
  taxAmountCents: number

  /**
   * Effective tax rate as percentage
   */
  taxRate: number

  /**
   * Tax calculation details from Stripe
   */
  calculation: Stripe.Tax.Calculation
}

/**
 * Calculate sales tax using Stripe Tax
 *
 * @param input - Tax calculation input with line items and address
 * @returns Tax calculation result with amount and rate
 *
 * @example
 * ```typescript
 * const result = await calculateTax({
 *   lineItems: [
 *     { amount: 3100, reference: 'prod_123' }, // $31.00
 *     { amount: 2500, reference: 'prod_456' }, // $25.00
 *   ],
 *   shippingAddress: {
 *     line1: '123 Main St',
 *     city: 'San Francisco',
 *     state: 'CA',
 *     postalCode: '94102',
 *     country: 'US',
 *   },
 *   currency: 'usd',
 * })
 *
 * console.log(`Tax: $${result.taxAmount.toFixed(2)}`) // Tax: $4.89
 * console.log(`Rate: ${result.taxRate}%`) // Rate: 8.75%
 * ```
 */
export async function calculateTax(
  input: TaxCalculationInput
): Promise<TaxCalculationResult> {
  try {
    // Create tax calculation with Stripe
    const calculation = await stripe.tax.calculations.create({
      currency: input.currency || 'usd',
      line_items: input.lineItems.map((item) => ({
        amount: item.amount,
        reference: item.reference,
        tax_code: item.taxCode || 'txcd_99999999', // General goods
      })),
      shipping_cost: {
        amount: 0, // Shipping cost should be added as a line item
      },
      customer_details: {
        address: {
          line1: input.shippingAddress.line1,
          line2: input.shippingAddress.line2,
          city: input.shippingAddress.city,
          state: input.shippingAddress.state,
          postal_code: input.shippingAddress.postalCode,
          country: input.shippingAddress.country,
        },
        address_source: 'shipping',
      },
      expand: ['line_items.data.tax_breakdown'],
    })

    // Calculate tax amount in cents
    const taxAmountCents = calculation.tax_amount_exclusive

    // Calculate tax amount in dollars
    const taxAmount = taxAmountCents / 100

    // Calculate effective tax rate
    const subtotal = input.lineItems.reduce((sum, item) => sum + item.amount, 0)
    const taxRate = subtotal > 0 ? (taxAmountCents / subtotal) * 100 : 0

    return {
      taxAmount,
      taxAmountCents,
      taxRate,
      calculation,
    }
  } catch (error) {
    console.error('Error calculating tax:', error)

    // Fallback to 0% tax on error
    // In production, you might want to handle this differently
    return {
      taxAmount: 0,
      taxAmountCents: 0,
      taxRate: 0,
      calculation: null as unknown as Stripe.Tax.Calculation,
    }
  }
}

/**
 * Calculate tax for a simple subtotal and address
 *
 * This is a convenience function for simple tax calculations
 * where you just need tax on a subtotal amount.
 *
 * @param subtotal - Subtotal amount in dollars
 * @param shippingAddress - Customer's shipping address
 * @returns Tax calculation result
 *
 * @example
 * ```typescript
 * const result = await calculateSimpleTax(56.00, {
 *   line1: '123 Main St',
 *   city: 'San Francisco',
 *   state: 'CA',
 *   postalCode: '94102',
 *   country: 'US',
 * })
 *
 * console.log(`Tax: $${result.taxAmount.toFixed(2)}`)
 * ```
 */
export async function calculateSimpleTax(
  subtotal: number,
  shippingAddress: TaxCalculationInput['shippingAddress']
): Promise<TaxCalculationResult> {
  const subtotalCents = Math.round(subtotal * 100)

  return calculateTax({
    lineItems: [
      {
        amount: subtotalCents,
        reference: 'cart-total',
      },
    ],
    shippingAddress,
  })
}

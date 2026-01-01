/**
 * Shipping Calculation Service
 *
 * Calculates real-time shipping rates using Shippo API
 * Supports multiple carriers: USPS, UPS, FedEx, DHL, etc.
 */

export interface ShippingAddress {
  name: string
  street1: string
  street2?: string
  city: string
  state: string
  zip: string
  country: string
  phone?: string
  email?: string
}

export interface ShippingParcel {
  length: string // inches
  width: string // inches
  height: string // inches
  weight: string // pounds
  distanceUnit?: 'in' | 'cm'
  massUnit?: 'lb' | 'kg'
}

export interface ShippingRate {
  objectId: string
  provider: string // 'USPS', 'UPS', 'FedEx', etc.
  servicelevel: {
    name: string // 'Priority Mail', 'Ground', etc.
    token: string
  }
  amount: string // Price in dollars as string (e.g., '5.99')
  currency: string
  estimatedDays: number
  durationTerms: string // 'Delivery in 2-3 business days'
}

export interface ShippingCalculationInput {
  fromAddress: ShippingAddress
  toAddress: ShippingAddress
  parcels: ShippingParcel[]
}

export interface ShippingCalculationResult {
  rates: ShippingRate[]
  cheapestRate: ShippingRate | null
  fastestRate: ShippingRate | null
}

/**
 * Calculate shipping rates using Shippo API
 *
 * @param input - Shipping calculation input with addresses and parcels
 * @returns Available shipping rates from multiple carriers
 *
 * @example
 * ```typescript
 * const result = await calculateShipping({
 *   fromAddress: {
 *     name: 'FU Project Warehouse',
 *     street1: '123 Warehouse St',
 *     city: 'San Francisco',
 *     state: 'CA',
 *     zip: '94102',
 *     country: 'US',
 *   },
 *   toAddress: {
 *     name: 'John Doe',
 *     street1: '456 Customer Ave',
 *     city: 'Los Angeles',
 *     state: 'CA',
 *     zip: '90001',
 *     country: 'US',
 *   },
 *   parcels: [
 *     {
 *       length: '10',
 *       width: '8',
 *       height: '4',
 *       weight: '2',
 *     },
 *   ],
 * })
 *
 * console.log(`Cheapest: $${result.cheapestRate?.amount}`)
 * console.log(`Fastest: ${result.fastestRate?.servicelevel.name}`)
 * ```
 */
export async function calculateShipping(
  input: ShippingCalculationInput
): Promise<ShippingCalculationResult> {
  const SHIPPO_API_KEY = process.env.SHIPPO_API_KEY

  if (!SHIPPO_API_KEY) {
    console.error('SHIPPO_API_KEY not configured')

    // Return fallback rates when Shippo is not configured
    return {
      rates: [
        {
          objectId: 'fallback_standard',
          provider: 'USPS',
          servicelevel: {
            name: 'Standard Shipping',
            token: 'usps_priority',
          },
          amount: '5.99',
          currency: 'USD',
          estimatedDays: 3,
          durationTerms: 'Delivery in 2-3 business days',
        },
        {
          objectId: 'fallback_express',
          provider: 'USPS',
          servicelevel: {
            name: 'Express Shipping',
            token: 'usps_priority_express',
          },
          amount: '12.99',
          currency: 'USD',
          estimatedDays: 1,
          durationTerms: 'Delivery in 1-2 business days',
        },
      ],
      cheapestRate: {
        objectId: 'fallback_standard',
        provider: 'USPS',
        servicelevel: {
          name: 'Standard Shipping',
          token: 'usps_priority',
        },
        amount: '5.99',
        currency: 'USD',
        estimatedDays: 3,
        durationTerms: 'Delivery in 2-3 business days',
      },
      fastestRate: {
        objectId: 'fallback_express',
        provider: 'USPS',
        servicelevel: {
          name: 'Express Shipping',
          token: 'usps_priority_express',
        },
        amount: '12.99',
        currency: 'USD',
        estimatedDays: 1,
        durationTerms: 'Delivery in 1-2 business days',
      },
    }
  }

  try {
    // Create shipment with Shippo API
    const response = await fetch('https://api.goshippo.com/shipments/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `ShippoToken ${SHIPPO_API_KEY}`,
      },
      body: JSON.stringify({
        address_from: {
          name: input.fromAddress.name,
          street1: input.fromAddress.street1,
          street2: input.fromAddress.street2,
          city: input.fromAddress.city,
          state: input.fromAddress.state,
          zip: input.fromAddress.zip,
          country: input.fromAddress.country,
          phone: input.fromAddress.phone,
          email: input.fromAddress.email,
        },
        address_to: {
          name: input.toAddress.name,
          street1: input.toAddress.street1,
          street2: input.toAddress.street2,
          city: input.toAddress.city,
          state: input.toAddress.state,
          zip: input.toAddress.zip,
          country: input.toAddress.country,
          phone: input.toAddress.phone,
          email: input.toAddress.email,
        },
        parcels: input.parcels.map((parcel) => ({
          length: parcel.length,
          width: parcel.width,
          height: parcel.height,
          weight: parcel.weight,
          distance_unit: parcel.distanceUnit || 'in',
          mass_unit: parcel.massUnit || 'lb',
        })),
        async: false, // Wait for rates to be calculated
      }),
    })

    if (!response.ok) {
      throw new Error(`Shippo API error: ${response.statusText}`)
    }

    const data = await response.json()

    // Extract rates from response
    const rates: ShippingRate[] = data.rates
      .filter((rate: { available: boolean }) => rate.available)
      .map((rate: {
        object_id: string
        provider: string
        servicelevel: { name: string; token: string }
        amount: string
        currency: string
        estimated_days: number
        duration_terms: string
      }) => ({
        objectId: rate.object_id,
        provider: rate.provider,
        servicelevel: {
          name: rate.servicelevel.name,
          token: rate.servicelevel.token,
        },
        amount: rate.amount,
        currency: rate.currency,
        estimatedDays: rate.estimated_days || 0,
        durationTerms: rate.duration_terms || '',
      }))

    // Find cheapest and fastest rates
    const cheapestRate =
      rates.length > 0
        ? rates.reduce((cheapest, rate) =>
            parseFloat(rate.amount) < parseFloat(cheapest.amount)
              ? rate
              : cheapest
          )
        : null

    const fastestRate =
      rates.length > 0
        ? rates.reduce((fastest, rate) =>
            rate.estimatedDays < fastest.estimatedDays ? rate : fastest
          )
        : null

    return {
      rates,
      cheapestRate,
      fastestRate,
    }
  } catch (error) {
    console.error('Error calculating shipping rates:', error)

    // Return fallback rates on error
    return {
      rates: [
        {
          objectId: 'fallback_standard',
          provider: 'USPS',
          servicelevel: {
            name: 'Standard Shipping',
            token: 'usps_priority',
          },
          amount: '5.99',
          currency: 'USD',
          estimatedDays: 3,
          durationTerms: 'Delivery in 2-3 business days',
        },
      ],
      cheapestRate: {
        objectId: 'fallback_standard',
        provider: 'USPS',
        servicelevel: {
          name: 'Standard Shipping',
          token: 'usps_priority',
        },
        amount: '5.99',
        currency: 'USD',
        estimatedDays: 3,
        durationTerms: 'Delivery in 2-3 business days',
      },
      fastestRate: null,
    }
  }
}

/**
 * Calculate shipping for a simple cart
 *
 * This is a convenience function for basic shipping calculations
 * using default warehouse address and standard parcel size.
 *
 * @param toAddress - Customer's shipping address
 * @param totalWeight - Total weight of items in pounds
 * @returns Shipping calculation result
 *
 * @example
 * ```typescript
 * const result = await calculateSimpleShipping(
 *   {
 *     name: 'John Doe',
 *     street1: '456 Customer Ave',
 *     city: 'Los Angeles',
 *     state: 'CA',
 *     zip: '90001',
 *     country: 'US',
 *   },
 *   2.5 // 2.5 pounds
 * )
 * ```
 */
export async function calculateSimpleShipping(
  toAddress: ShippingAddress,
  totalWeight: number = 2
): Promise<ShippingCalculationResult> {
  // Default warehouse address (should be configured via environment variables)
  const fromAddress: ShippingAddress = {
    name: process.env.WAREHOUSE_NAME || 'FU Project Warehouse',
    street1: process.env.WAREHOUSE_STREET1 || '123 Warehouse St',
    street2: process.env.WAREHOUSE_STREET2,
    city: process.env.WAREHOUSE_CITY || 'San Francisco',
    state: process.env.WAREHOUSE_STATE || 'CA',
    zip: process.env.WAREHOUSE_ZIP || '94102',
    country: process.env.WAREHOUSE_COUNTRY || 'US',
    phone: process.env.WAREHOUSE_PHONE,
    email: process.env.WAREHOUSE_EMAIL,
  }

  // Standard parcel size for most products
  const parcels: ShippingParcel[] = [
    {
      length: '12',
      width: '10',
      height: '6',
      weight: totalWeight.toString(),
    },
  ]

  return calculateShipping({
    fromAddress,
    toAddress,
    parcels,
  })
}

import { graphqlClient } from './graphql'

// GraphQL Queries and Mutations for Customer Management

export const GET_CUSTOMER = `
  query GetCustomer($customerId: Int!) {
    customer(customerId: $customerId) {
      id
      databaseId
      email
      firstName
      lastName
      username
      billing {
        firstName
        lastName
        company
        address1
        address2
        city
        state
        postcode
        country
        email
        phone
      }
      shipping {
        firstName
        lastName
        company
        address1
        address2
        city
        state
        postcode
        country
      }
    }
  }
`

export const UPDATE_CUSTOMER_ADDRESS = `
  mutation UpdateCustomer(
    $id: ID!
    $billing: CustomerAddressInput
    $shipping: CustomerAddressInput
  ) {
    updateCustomer(input: {
      id: $id
      billing: $billing
      shipping: $shipping
    }) {
      customer {
        id
        billing {
          firstName
          lastName
          company
          address1
          address2
          city
          state
          postcode
          country
          email
          phone
        }
        shipping {
          firstName
          lastName
          company
          address1
          address2
          city
          state
          postcode
          country
        }
      }
    }
  }
`

export const GET_CUSTOMER_META = `
  query GetCustomerMeta($customerId: Int!, $key: String!) {
    customer(customerId: $customerId) {
      id
      metaData(key: $key) {
        key
        value
      }
    }
  }
`

export const UPDATE_CUSTOMER_META = `
  mutation UpdateCustomerMeta($id: ID!, $metaData: [MetaDataInput!]) {
    updateCustomer(input: {
      id: $id
      metaData: $metaData
    }) {
      customer {
        id
        metaData {
          key
          value
        }
      }
    }
  }
`

// TypeScript Interfaces

export interface Address {
  id: string
  type: 'billing' | 'shipping'
  firstName: string
  lastName: string
  company?: string
  address1: string
  address2?: string
  city: string
  state: string
  postcode: string
  country: string
  phone?: string
  email?: string
}

export interface WishlistItem {
  id: string
  productId: string
  name: string
  price: string
  salePrice?: string
  image?: string
  slug: string
  category: string
  subCategory: string
  onSale: boolean
  addedAt: number
  // Price tracking for notifications
  originalPrice: string // Price when added to wishlist
  lastCheckedPrice: string // Last known price
  lastCheckedAt: number // Timestamp of last check
  priceDropNotified?: boolean // Whether user was notified of current price drop
}

export interface CustomerData {
  id: string
  databaseId: number
  email: string
  firstName?: string
  lastName?: string
  billing?: Address
  shipping?: Address
}

// Helper Functions

/**
 * Get customer data including addresses
 */
export async function getCustomer(customerId: number, authToken: string): Promise<CustomerData | null> {
  try {
    const response = await fetch(process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:8080/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        query: GET_CUSTOMER,
        variables: { customerId }
      })
    })

    const result = await response.json()
    if (result.errors) {
      console.error('GraphQL error:', result.errors)
      return null
    }

    const customer = result.data?.customer
    if (!customer) return null

    return {
      id: customer.id,
      databaseId: customer.databaseId,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      billing: customer.billing ? {
        id: 'billing-1',
        type: 'billing',
        firstName: customer.billing.firstName || '',
        lastName: customer.billing.lastName || '',
        company: customer.billing.company || '',
        address1: customer.billing.address1 || '',
        address2: customer.billing.address2 || '',
        city: customer.billing.city || '',
        state: customer.billing.state || '',
        postcode: customer.billing.postcode || '',
        country: customer.billing.country || 'US',
        phone: customer.billing.phone || '',
        email: customer.billing.email || customer.email
      } : undefined,
      shipping: customer.shipping ? {
        id: 'shipping-1',
        type: 'shipping',
        firstName: customer.shipping.firstName || '',
        lastName: customer.shipping.lastName || '',
        company: customer.shipping.company || '',
        address1: customer.shipping.address1 || '',
        address2: customer.shipping.address2 || '',
        city: customer.shipping.city || '',
        state: customer.shipping.state || '',
        postcode: customer.shipping.postcode || '',
        country: customer.shipping.country || 'US'
      } : undefined
    }
  } catch (error) {
    console.error('Error fetching customer:', error)
    return null
  }
}

/**
 * Update customer addresses (billing and/or shipping)
 */
export async function updateCustomerAddresses(
  customerId: string,
  addresses: { billing?: Partial<Address>, shipping?: Partial<Address> },
  authToken: string
): Promise<boolean> {
  try {
    const billingInput = addresses.billing ? {
      firstName: addresses.billing.firstName,
      lastName: addresses.billing.lastName,
      company: addresses.billing.company || '',
      address1: addresses.billing.address1,
      address2: addresses.billing.address2 || '',
      city: addresses.billing.city,
      state: addresses.billing.state,
      postcode: addresses.billing.postcode,
      country: addresses.billing.country,
      email: addresses.billing.email,
      phone: addresses.billing.phone || ''
    } : undefined

    const shippingInput = addresses.shipping ? {
      firstName: addresses.shipping.firstName,
      lastName: addresses.shipping.lastName,
      company: addresses.shipping.company || '',
      address1: addresses.shipping.address1,
      address2: addresses.shipping.address2 || '',
      city: addresses.shipping.city,
      state: addresses.shipping.state,
      postcode: addresses.shipping.postcode,
      country: addresses.shipping.country
    } : undefined

    const response = await fetch(process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:8080/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        query: UPDATE_CUSTOMER_ADDRESS,
        variables: {
          id: customerId,
          billing: billingInput,
          shipping: shippingInput
        }
      })
    })

    const result = await response.json()
    if (result.errors) {
      console.error('GraphQL error:', result.errors)
      return false
    }

    return true
  } catch (error) {
    console.error('Error updating customer addresses:', error)
    return false
  }
}

/**
 * Get customer wishlist from user meta
 */
export async function getWishlist(customerId: number, authToken: string): Promise<WishlistItem[]> {
  try {
    const response = await fetch(process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:8080/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        query: GET_CUSTOMER_META,
        variables: {
          customerId,
          key: 'wishlist'
        }
      })
    })

    const result = await response.json()
    if (result.errors || !result.data?.customer) {
      return []
    }

    const metaData = result.data.customer.metaData
    if (!metaData || !metaData.value) {
      return []
    }

    // Parse wishlist JSON
    try {
      return JSON.parse(metaData.value)
    } catch {
      return []
    }
  } catch (error) {
    console.error('Error fetching wishlist:', error)
    return []
  }
}

/**
 * Update customer wishlist in user meta
 */
export async function updateWishlist(
  customerId: string,
  wishlist: WishlistItem[],
  authToken: string
): Promise<boolean> {
  try {
    const response = await fetch(process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:8080/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        query: UPDATE_CUSTOMER_META,
        variables: {
          id: customerId,
          metaData: [
            {
              key: 'wishlist',
              value: JSON.stringify(wishlist)
            }
          ]
        }
      })
    })

    const result = await response.json()
    if (result.errors) {
      console.error('GraphQL error:', result.errors)
      return false
    }

    return true
  } catch (error) {
    console.error('Error updating wishlist:', error)
    return false
  }
}

/**
 * Add item to wishlist
 */
export async function addToWishlist(
  customerId: string,
  item: WishlistItem,
  authToken: string
): Promise<boolean> {
  try {
    // Get current wishlist
    const currentWishlist = await getWishlist(parseInt(customerId), authToken)

    // Check if item already exists
    const exists = currentWishlist.some(w => w.productId === item.productId)
    if (exists) {
      return true // Already in wishlist
    }

    // Add new item
    const updatedWishlist = [...currentWishlist, item]

    // Save updated wishlist
    return await updateWishlist(customerId, updatedWishlist, authToken)
  } catch (error) {
    console.error('Error adding to wishlist:', error)
    return false
  }
}

/**
 * Remove item from wishlist
 */
export async function removeFromWishlist(
  customerId: string,
  itemId: string,
  authToken: string
): Promise<boolean> {
  try {
    // Get current wishlist
    const currentWishlist = await getWishlist(parseInt(customerId), authToken)

    // Filter out the item
    const updatedWishlist = currentWishlist.filter(item => item.id !== itemId)

    // Save updated wishlist
    return await updateWishlist(customerId, updatedWishlist, authToken)
  } catch (error) {
    console.error('Error removing from wishlist:', error)
    return false
  }
}

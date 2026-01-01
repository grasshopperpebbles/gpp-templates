/**
 * WooCommerce Order Management
 * GraphQL mutations and queries for order creation and retrieval
 */

export const CREATE_ORDER = `
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      order {
        id
        databaseId
        orderNumber
        status
        total
        subtotal
        totalTax
        shippingTotal
        paymentMethodTitle
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
        lineItems {
          nodes {
            productId
            quantity
            total
            product {
              node {
                id
                databaseId
                name
                slug
                image {
                  sourceUrl
                }
              }
            }
          }
        }
        customerNote
        createdVia
      }
      clientMutationId
    }
  }
`

export const GET_ORDER = `
  query GetOrder($id: ID!) {
    order(id: $id, idType: DATABASE_ID) {
      id
      databaseId
      orderNumber
      status
      total
      subtotal
      totalTax
      shippingTotal
      paymentMethodTitle
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
      lineItems {
        nodes {
          productId
          quantity
          total
          subtotal
          product {
            node {
              id
              databaseId
              name
              slug
              image {
                sourceUrl
              }
              price
            }
          }
        }
      }
      date
      customerNote
      createdVia
    }
  }
`

export interface OrderLineItem {
  productId: number
  quantity: number
  total?: string
}

export interface OrderAddress {
  firstName: string
  lastName: string
  company?: string
  address1: string
  address2?: string
  city: string
  state: string
  postcode: string
  country: string
  email?: string
  phone?: string
}

export interface CreateOrderInput {
  clientMutationId?: string
  customerId?: number
  status?: string
  currency?: string
  paymentMethod?: string
  paymentMethodTitle?: string
  setPaid?: boolean
  transactionId?: string
  billing?: OrderAddress
  shipping?: OrderAddress
  lineItems?: OrderLineItem[]
  shippingLines?: Array<{
    methodId: string
    methodTitle: string
    total: string
  }>
  customerNote?: string
  metaData?: Array<{
    key: string
    value: string
  }>
}

export interface WooCommerceOrder {
  id: string
  databaseId: number
  orderNumber: string
  status: string
  total: string
  subtotal: string
  totalTax: string
  shippingTotal: string
  paymentMethodTitle: string
  billing: OrderAddress
  shipping: OrderAddress
  lineItems: {
    nodes: Array<{
      productId: number
      quantity: number
      total: string
      product: {
        node: {
          id: string
          databaseId: number
          name: string
          slug: string
          image: {
            sourceUrl: string
          }
          price?: string
        }
      }
    }>
  }
  date?: string
  customerNote?: string
  createdVia?: string
}

/**
 * Create a new order in WooCommerce
 */
export async function createWooCommerceOrder(
  input: CreateOrderInput,
  authToken: string
): Promise<WooCommerceOrder | null> {
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:8080/graphql',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          query: CREATE_ORDER,
          variables: {
            input: {
              ...input,
              clientMutationId: `create-order-${Date.now()}`,
            },
          },
        }),
      }
    )

    const result = await response.json()

    if (result.errors) {
      console.error('GraphQL errors:', result.errors)
      throw new Error(result.errors[0]?.message || 'Failed to create order')
    }

    return result.data?.createOrder?.order || null
  } catch (error) {
    console.error('Error creating order:', error)
    throw error
  }
}

/**
 * Get order details by ID
 */
export async function getOrder(
  orderId: number,
  authToken: string
): Promise<WooCommerceOrder | null> {
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:8080/graphql',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          query: GET_ORDER,
          variables: { id: orderId },
        }),
      }
    )

    const result = await response.json()

    if (result.errors) {
      console.error('GraphQL errors:', result.errors)
      return null
    }

    return result.data?.order || null
  } catch (error) {
    console.error('Error fetching order:', error)
    return null
  }
}

import { graphqlClient } from './graphql' // Use existing GraphQL client

// Types for GraphQL responses
interface LoginResponse {
  login: {
    authToken: string
    refreshToken: string
    user: {
      id: string
      databaseId: number
      email: string
      firstName: string
      lastName: string
      displayName: string
      avatar?: {
        url: string
      }
    }
  }
}

interface RegisterResponse {
  registerUser: {
    user: {
      id: string
      databaseId: number
      email: string
      firstName: string
      lastName: string
      displayName: string
    }
  }
}

interface PasswordResetResponse {
  sendPasswordResetEmail: {
    success: boolean
    user: {
      email: string
    }
  }
}

interface ResetPasswordResponse {
  resetUserPassword: {
    user: {
      email: string
    }
  }
}

interface ViewerResponse {
  viewer: {
    id: string
    databaseId: number
    email: string
    firstName: string
    lastName: string
    displayName: string
    avatar?: {
      url: string
    }
  }
}

// WooCommerce GraphQL Mutations
export const LOGIN_USER = `
  mutation LoginUser($username: String!, $password: String!) {
    login(input: {
      username: $username
      password: $password
    }) {
      authToken
      refreshToken
      user {
        id
        databaseId
        email
        firstName
        lastName
        displayName
        avatar {
          url
        }
      }
    }
  }
`

export const REGISTER_USER = `
  mutation RegisterUser($username: String!, $email: String!, $password: String!, $firstName: String, $lastName: String) {
    registerUser(input: {
      username: $username
      email: $email
      password: $password
      firstName: $firstName
      lastName: $lastName
    }) {
      user {
        id
        databaseId
        email
        firstName
        lastName
        displayName
      }
    }
  }
`

export const GET_CURRENT_USER = `
  query GetCurrentUser {
    viewer {
      id
      databaseId
      email
      firstName
      lastName
      displayName
      avatar {
        url
      }
    }
  }
`

export const SEND_PASSWORD_RESET_EMAIL = `
  mutation SendPasswordResetEmail($username: String!) {
    sendPasswordResetEmail(input: {
      username: $username
    }) {
      success
      user {
        email
      }
    }
  }
`

export const RESET_USER_PASSWORD = `
  mutation ResetUserPassword($key: String!, $login: String!, $password: String!) {
    resetUserPassword(input: {
      key: $key
      login: $login
      password: $password
    }) {
      user {
        id
        email
      }
    }
  }
`

export const GET_CUSTOMER_ORDERS = `
  query GetCustomerOrders($customerId: Int!, $first: Int = 10) {
    customer(customerId: $customerId) {
      orders(first: $first) {
        nodes {
          id
          databaseId
          orderNumber
          date
          status
          total
          lineItems {
            nodes {
              quantity
              total
              product {
                node {
                  name
                  image {
                    sourceUrl
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`

export const UPDATE_CUSTOMER = `
  mutation UpdateCustomer($id: ID!, $firstName: String, $lastName: String, $email: String) {
    updateCustomer(input: {
      id: $id
      firstName: $firstName
      lastName: $lastName
      email: $email
    }) {
      customer {
        id
        firstName
        lastName
        email
      }
    }
  }
`

// Authentication helper functions
export async function authenticateWooUser(email: string, password: string) {
  try {
    const result = await graphqlClient.query<LoginResponse>(LOGIN_USER, {
      username: email,
      password: password
    })

    if (result.login?.authToken) {
      return {
        id: result.login.user.databaseId,
        email: result.login.user.email,
        name: result.login.user.displayName || `${result.login.user.firstName} ${result.login.user.lastName}`.trim(),
        firstName: result.login.user.firstName,
        lastName: result.login.user.lastName,
        avatar: result.login.user.avatar?.url,
        authToken: result.login.authToken,
        refreshToken: result.login.refreshToken
      }
    }
    return null
  } catch (error) {
    console.error('WooCommerce auth error:', error)
    return null
  }
}

export async function registerWooUser(email: string, password: string, firstName?: string, lastName?: string) {
  try {
    const result = await graphqlClient.query<RegisterResponse>(REGISTER_USER, {
      username: email,
      email: email,
      password: password,
      firstName: firstName || '',
      lastName: lastName || ''
    })
    
    return result.registerUser?.user || null
  } catch (error) {
    console.error('WooCommerce registration error:', error)
    throw error
  }
}

export async function getCurrentWooUser(authToken: string) {
  try {
    // Set auth token in GraphQL client for this request
    const originalClient = graphqlClient
    
    // Create a temporary client with auth header
    const authGraphQLClient = {
      async query(query: string, variables?: Record<string, unknown>) {
        const response = await fetch(originalClient['endpoint'], {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({ query, variables })
        })
        
        const result = await response.json()
        if (result.errors) {
          throw new Error(result.errors[0]?.message || 'GraphQL error')
        }
        return result.data
      }
    }
    
    const result = await authGraphQLClient.query(GET_CURRENT_USER)
    return result.viewer
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

export async function sendPasswordResetEmail(email: string) {
  try {
    const result = await graphqlClient.query<PasswordResetResponse>(SEND_PASSWORD_RESET_EMAIL, {
      username: email
    })
    
    return result.sendPasswordResetEmail?.success || false
  } catch (error) {
    console.error('Password reset error:', error)
    return false
  }
}

export async function resetPassword(key: string, login: string, password: string) {
  try {
    const result = await graphqlClient.query<ResetPasswordResponse>(RESET_USER_PASSWORD, {
      key,
      login,
      password
    })
    
    return result.resetUserPassword?.user || null
  } catch (error) {
    console.error('Password reset error:', error)
    throw error
  }
}

export async function getCustomerOrders(customerId: number, authToken: string) {
  try {
    // Use authenticated GraphQL client
    const response = await fetch(process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:8080/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        query: GET_CUSTOMER_ORDERS,
        variables: { customerId }
      })
    })
    
    const result = await response.json()
    if (result.errors) {
      throw new Error(result.errors[0]?.message || 'GraphQL error')
    }
    
    return result.data.customer?.orders?.nodes || []
  } catch (error) {
    console.error('Error fetching customer orders:', error)
    return []
  }
}

export async function updateCustomer(id: string, data: {
  firstName?: string
  lastName?: string
  email?: string
}, authToken: string) {
  try {
    const response = await fetch(process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:8080/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        query: UPDATE_CUSTOMER,
        variables: { id, ...data }
      })
    })
    
    const result = await response.json()
    if (result.errors) {
      throw new Error(result.errors[0]?.message || 'GraphQL error')
    }
    
    return result.data.updateCustomer?.customer || null
  } catch (error) {
    console.error('Error updating customer:', error)
    throw error
  }
}

// Type definitions
export interface WooUser {
  id: number
  email: string
  name: string
  firstName?: string
  lastName?: string
  avatar?: string
  authToken: string
  refreshToken?: string
}

export interface WooOrder {
  id: string
  databaseId: number
  orderNumber: string
  date: string
  status: string
  total: string
  lineItems: {
    nodes: Array<{
      quantity: number
      total: string
      product: {
        node: {
          name: string
          image?: {
            sourceUrl: string
          }
        }
      }
    }>
  }
}
/**
 * Strapi API Client
 * Works with Strapi REST API and GraphQL
 */

interface StrapiResponse<T> {
  data: T
  meta?: {
    pagination?: {
      page: number
      pageSize: number
      pageCount: number
      total: number
    }
  }
}

interface StrapiGraphQLResponse<T> {
  data?: T
  errors?: Array<{
    message: string
    locations?: Array<{ line: number; column: number }>
    path?: string[]
  }>
}

export class StrapiClient {
  private baseUrl: string
  private apiToken: string | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
  }

  setApiToken(token: string | null) {
    this.apiToken = token
  }

  getApiToken(): string | null {
    return this.apiToken
  }

  /**
   * REST API: Get collection items
   */
  async getCollection<T>(
    contentType: string,
    options?: {
      populate?: string | string[]
      filters?: Record<string, unknown>
      sort?: string | string[]
      pagination?: {
        page?: number
        pageSize?: number
        start?: number
        limit?: number
      }
      fields?: string[]
    }
  ): Promise<StrapiResponse<T[]>> {
    const params = new URLSearchParams()

    if (options?.populate) {
      if (Array.isArray(options.populate)) {
        params.append('populate', options.populate.join(','))
      } else {
        params.append('populate', options.populate)
      }
    }

    if (options?.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        params.append(`filters[${key}]`, String(value))
      })
    }

    if (options?.sort) {
      if (Array.isArray(options.sort)) {
        params.append('sort', options.sort.join(','))
      } else {
        params.append('sort', options.sort)
      }
    }

    if (options?.pagination) {
      if (options.pagination.page) {
        params.append('pagination[page]', String(options.pagination.page))
      }
      if (options.pagination.pageSize) {
        params.append('pagination[pageSize]', String(options.pagination.pageSize))
      }
      if (options.pagination.start) {
        params.append('pagination[start]', String(options.pagination.start))
      }
      if (options.pagination.limit) {
        params.append('pagination[limit]', String(options.pagination.limit))
      }
    }

    if (options?.fields) {
      params.append('fields', options.fields.join(','))
    }

    const url = `${this.baseUrl}/api/${contentType}${params.toString() ? `?${params.toString()}` : ''}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.apiToken) {
      headers['Authorization'] = `Bearer ${this.apiToken}`
    }

    const response = await fetch(url, {
      headers,
      next: { revalidate: 60 }, // Revalidate every 60 seconds
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  /**
   * REST API: Get single item
   */
  async getItem<T>(
    contentType: string,
    id: string | number,
    options?: {
      populate?: string | string[]
      fields?: string[]
    }
  ): Promise<StrapiResponse<T>> {
    const params = new URLSearchParams()

    if (options?.populate) {
      if (Array.isArray(options.populate)) {
        params.append('populate', options.populate.join(','))
      } else {
        params.append('populate', options.populate)
      }
    }

    if (options?.fields) {
      params.append('fields', options.fields.join(','))
    }

    const url = `${this.baseUrl}/api/${contentType}/${id}${params.toString() ? `?${params.toString()}` : ''}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.apiToken) {
      headers['Authorization'] = `Bearer ${this.apiToken}`
    }

    const response = await fetch(url, {
      headers,
      next: { revalidate: 60 },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  /**
   * GraphQL: Execute query
   */
  async graphql<T>(
    query: string,
    variables?: Record<string, unknown>,
    fetchOptions?: RequestInit
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.apiToken) {
      headers['Authorization'] = `Bearer ${this.apiToken}`
    }

    const response = await fetch(`${this.baseUrl}/graphql`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query,
        variables,
      }),
      ...fetchOptions,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result: StrapiGraphQLResponse<T> = await response.json()

    if (result.errors) {
      throw new Error(result.errors[0]?.message || 'GraphQL error')
    }

    if (!result.data) {
      throw new Error('No data returned from GraphQL query')
    }

    return result.data
  }
}

// Create default client instance
export const strapiClient = new StrapiClient(
  process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'
)

// Set API token from environment if available
if (process.env.STRAPI_API_TOKEN) {
  strapiClient.setApiToken(process.env.STRAPI_API_TOKEN)
}


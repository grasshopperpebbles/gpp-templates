/**
 * GraphQL Client for SaaS Dashboard
 *
 * Works with any GraphQL endpoint (FastAPI, Strapi, etc.)
 * Supports Bearer token authentication.
 */

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || "";

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
    extensions?: Record<string, unknown>;
  }>;
}

export class GraphQLClient {
  private endpoint: string;
  private authToken: string | null = null;

  constructor(endpoint?: string) {
    this.endpoint = endpoint || GRAPHQL_ENDPOINT;
    if (!this.endpoint) {
      console.warn("GraphQL endpoint not configured. Set NEXT_PUBLIC_GRAPHQL_ENDPOINT environment variable.");
    }
  }

  /**
   * Set Bearer token for authentication
   */
  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  /**
   * Get the in-memory auth token
   */
  getAuthToken(): string | null {
    return this.authToken;
  }

  /**
   * Execute a GraphQL query or mutation
   */
  async query<T>(
    query: string,
    variables?: Record<string, unknown>,
    fetchOptions?: RequestInit
  ): Promise<T> {
    if (!this.endpoint) {
      throw new Error("GraphQL endpoint not configured");
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add Bearer token if available
    const token = this.getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(this.endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query,
        variables,
      }),
      ...fetchOptions,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: GraphQLResponse<T> = await response.json();

    if (result.errors) {
      const error = result.errors[0];
      throw new Error(error?.message || "GraphQL error");
    }

    if (!result.data) {
      throw new Error("No data returned from GraphQL query");
    }

    return result.data;
  }

  /**
   * Execute a GraphQL mutation
   */
  async mutate<T>(
    mutation: string,
    variables?: Record<string, unknown>,
    fetchOptions?: RequestInit
  ): Promise<T> {
    return this.query<T>(mutation, variables, fetchOptions);
  }
}

/**
 * Default GraphQL client instance
 */
export const graphqlClient = new GraphQLClient();

/**
 * Helper function to create a GraphQL client with a custom endpoint
 */
export function createGraphQLClient(endpoint: string): GraphQLClient {
  return new GraphQLClient(endpoint);
}

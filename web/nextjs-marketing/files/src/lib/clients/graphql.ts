/**
 * Generic GraphQL Client
 * 
 * Works with any GraphQL endpoint (FastAPI, Strapi, WordPress, etc.)
 * Supports Bearer token authentication and custom headers
 */

import { env } from "@/lib/env";

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
  private sessionToken: string | null = null; // For WordPress/WooCommerce compatibility

  constructor(endpoint?: string) {
    this.endpoint = endpoint || env.graphqlEndpoint || "";
    if (!this.endpoint) {
      throw new Error("GraphQL endpoint not configured. Set NEXT_PUBLIC_GRAPHQL_ENDPOINT environment variable.");
    }
  }

  /**
   * Set Bearer token for authentication (FastAPI, Strapi, etc.)
   */
  setAuthToken(token: string | null) {
    this.authToken = token;
    // Persist to localStorage if available
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("graphql_auth_token", token);
      } else {
        localStorage.removeItem("graphql_auth_token");
      }
    }
  }

  /**
   * Get stored auth token from localStorage
   */
  getAuthToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("graphql_auth_token");
    }
    return this.authToken;
  }

  /**
   * Set session token (for WordPress/WooCommerce compatibility)
   */
  setSessionToken(token: string | null) {
    this.sessionToken = token;
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("graphql_session_token", token);
      } else {
        localStorage.removeItem("graphql_session_token");
      }
    }
  }

  /**
   * Get stored session token from localStorage
   */
  getSessionToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("graphql_session_token");
    }
    return this.sessionToken;
  }

  /**
   * Execute a GraphQL query or mutation
   */
  async query<T>(
    query: string,
    variables?: Record<string, unknown>,
    fetchOptions?: RequestInit
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add Bearer token if available (for FastAPI, Strapi, etc.)
    const token = this.getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Add session token if available (for WordPress/WooCommerce)
    const sessionToken = this.getSessionToken();
    if (sessionToken) {
      headers["woocommerce-session"] = `Session ${sessionToken}`;
    }

    const response = await fetch(this.endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query,
        variables,
      }),
      ...fetchOptions, // Allow Next.js fetch options (cache, next.revalidate, etc.)
    });

    // Extract and store session token from response (WordPress/WooCommerce)
    const sessionHeader = response.headers.get("woocommerce-session");
    if (sessionHeader) {
      this.setSessionToken(sessionHeader);
    }

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
   * (Alias for query, but semantically clearer for mutations)
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
 * Configure via NEXT_PUBLIC_GRAPHQL_ENDPOINT environment variable
 */
export const graphqlClient = new GraphQLClient();

/**
 * Helper function to create a GraphQL client with a custom endpoint
 */
export function createGraphQLClient(endpoint: string): GraphQLClient {
  return new GraphQLClient(endpoint);
}

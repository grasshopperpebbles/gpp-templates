/**
 * GraphQL Client for Admin Dashboard
 *
 * Works with any GraphQL endpoint (FastAPI, Strapi, etc.).
 * Queries go to /api/graphql on this app's own origin; that server route adds
 * the signed-in admin's API token and forwards them to GRAPHQL_ENDPOINT.
 */

const GRAPHQL_PATH = "/api/graphql";

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

  constructor(endpoint?: string) {
    this.endpoint = endpoint || GRAPHQL_PATH;
  }

  /**
   * Execute a GraphQL query or mutation
   */
  async query<T>(
    query: string,
    variables?: Record<string, unknown>,
    fetchOptions?: RequestInit
  ): Promise<T> {
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        variables,
      }),
      credentials: "same-origin",
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
 * Helper function to create a GraphQL client with a custom same-origin path
 */
export function createGraphQLClient(endpoint: string): GraphQLClient {
  return new GraphQLClient(endpoint);
}

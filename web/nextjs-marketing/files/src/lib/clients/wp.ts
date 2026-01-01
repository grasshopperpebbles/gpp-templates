import { env } from "@/lib/env";
import { fetchJson } from "@/lib/http";

export async function wpGraphql<T>(query: string, variables?: Record<string, unknown>) {
  if (!env.wpGraphqlEndpoint) {
    throw new Error("NEXT_PUBLIC_WP_GRAPHQL_ENDPOINT is not set");
  }
  return fetchJson<T>(env.wpGraphqlEndpoint, {
    method: "POST",
    body: JSON.stringify({ query, variables }),
  });
}

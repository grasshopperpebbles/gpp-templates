export const env = {
  siteName: process.env.NEXT_PUBLIC_SITE_NAME ?? "GPP Web",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000",
  graphqlEndpoint: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ?? "",
  wpGraphqlEndpoint: process.env.NEXT_PUBLIC_WP_GRAPHQL_ENDPOINT ?? "",
} as const;

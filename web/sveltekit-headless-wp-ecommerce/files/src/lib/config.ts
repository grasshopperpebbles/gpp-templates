import { browser } from "$app/environment";

export const config = {
  graphqlEndpoint: browser
    ? import.meta.env.VITE_GRAPHQL_ENDPOINT || "http://localhost:8080/graphql"
    : process.env.VITE_GRAPHQL_ENDPOINT || "http://localhost:8080/graphql",
  appName: "My Store",
  appDescription: "An e-commerce store powered by WooCommerce and SvelteKit",
  currency: "USD",
  currencySymbol: "$",
};

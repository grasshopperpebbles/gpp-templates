import { browser } from "$app/environment";

export const config = {
  graphqlEndpoint: browser
    ? import.meta.env.VITE_GRAPHQL_ENDPOINT || "http://localhost:8080/graphql"
    : process.env.VITE_GRAPHQL_ENDPOINT || "http://localhost:8080/graphql",
  appName: "My Blog",
  appDescription: "A blog powered by WordPress and SvelteKit",
};

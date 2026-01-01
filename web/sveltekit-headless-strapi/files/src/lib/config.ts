import { browser } from "$app/environment";

export const config = {
  strapiUrl: browser
    ? import.meta.env.VITE_STRAPI_URL || "http://localhost:1337"
    : process.env.VITE_STRAPI_URL || "http://localhost:1337",
  appName: "My Blog",
  appDescription: "A blog powered by Strapi and SvelteKit",
};

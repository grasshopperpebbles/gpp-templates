import { strapi, type Article } from "$lib/strapi";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  try {
    const response = await strapi.getArticles({ pageSize: 6 });
    return {
      articles: response.data as Article[],
    };
  } catch (error) {
    console.error("Failed to fetch articles:", error);
    return {
      articles: [],
    };
  }
};

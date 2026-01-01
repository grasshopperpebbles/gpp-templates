import { error } from "@sveltejs/kit";
import { strapi, type Article } from "$lib/strapi";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  try {
    const response = await strapi.getArticle(params.slug);
    const articles = response.data as Article[];

    if (!articles.length) {
      throw error(404, "Article not found");
    }

    return {
      article: articles[0],
    };
  } catch (err) {
    if (err && typeof err === "object" && "status" in err) {
      throw err;
    }
    console.error("Failed to fetch article:", err);
    throw error(500, "Failed to load article");
  }
};

import { strapi, type Article, type Category } from "$lib/strapi";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url }) => {
  const page = parseInt(url.searchParams.get("page") || "1");

  try {
    const [articlesResponse, categoriesResponse] = await Promise.all([
      strapi.getArticles({ page, pageSize: 9 }),
      strapi.getCategories(),
    ]);

    return {
      articles: articlesResponse.data as Article[],
      categories: categoriesResponse.data as Category[],
      pagination: articlesResponse.meta.pagination || { page: 1, pageCount: 1, pageSize: 9, total: 0 },
      currentCategory: null,
    };
  } catch (error) {
    console.error("Failed to fetch articles:", error);
    return {
      articles: [],
      categories: [],
      pagination: { page: 1, pageCount: 1, pageSize: 9, total: 0 },
      currentCategory: null,
    };
  }
};

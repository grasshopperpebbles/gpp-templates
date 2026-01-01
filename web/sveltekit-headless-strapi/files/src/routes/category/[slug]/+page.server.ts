import { error } from "@sveltejs/kit";
import { strapi, type Article, type Category } from "$lib/strapi";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, url }) => {
  const page = parseInt(url.searchParams.get("page") || "1");

  try {
    const [categoryResponse, articlesResponse] = await Promise.all([
      strapi.getCategory(params.slug),
      strapi.getArticles({ page, pageSize: 9, category: params.slug }),
    ]);

    const categories = categoryResponse.data as Category[];

    if (!categories.length) {
      throw error(404, "Category not found");
    }

    return {
      category: categories[0],
      articles: articlesResponse.data as Article[],
      pagination: articlesResponse.meta.pagination || { page: 1, pageCount: 1, pageSize: 9, total: 0 },
    };
  } catch (err) {
    if (err && typeof err === "object" && "status" in err) {
      throw err;
    }
    console.error("Failed to fetch category:", err);
    throw error(500, "Failed to load category");
  }
};

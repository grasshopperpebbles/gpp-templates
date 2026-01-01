import { getPostsByCategory, type Post } from "$lib/wordpress";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, url }) => {
  const after = url.searchParams.get("after") || undefined;

  try {
    const response = await getPostsByCategory(params.slug, { first: 9, after });

    // Get category name from first post if available
    const categoryName = response.posts.nodes[0]?.categories?.nodes?.find(
      (c) => c.slug === params.slug
    )?.name || params.slug;

    return {
      posts: response.posts.nodes as Post[],
      categoryName,
      categorySlug: params.slug,
      pageInfo: response.posts.pageInfo,
    };
  } catch (error) {
    console.error("Failed to fetch posts by category:", error);
    return {
      posts: [],
      categoryName: params.slug,
      categorySlug: params.slug,
      pageInfo: { hasNextPage: false, hasPreviousPage: false },
    };
  }
};

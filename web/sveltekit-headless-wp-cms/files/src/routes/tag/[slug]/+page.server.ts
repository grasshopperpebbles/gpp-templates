import { getPostsByTag, type Post } from "$lib/wordpress";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, url }) => {
  const after = url.searchParams.get("after") || undefined;

  try {
    const response = await getPostsByTag(params.slug, { first: 9, after });

    // Get tag name from first post if available
    const tagName = response.posts.nodes[0]?.tags?.nodes?.find(
      (t) => t.slug === params.slug
    )?.name || params.slug;

    return {
      posts: response.posts.nodes as Post[],
      tagName,
      tagSlug: params.slug,
      pageInfo: response.posts.pageInfo,
    };
  } catch (error) {
    console.error("Failed to fetch posts by tag:", error);
    return {
      posts: [],
      tagName: params.slug,
      tagSlug: params.slug,
      pageInfo: { hasNextPage: false, hasPreviousPage: false },
    };
  }
};

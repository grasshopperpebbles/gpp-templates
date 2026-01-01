import { getPosts, getCategories, type Post, type PostCategory } from "$lib/wordpress";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url }) => {
  const after = url.searchParams.get("after") || undefined;

  try {
    const [postsResponse, categories] = await Promise.all([
      getPosts({ first: 9, after }),
      getCategories(),
    ]);

    return {
      posts: postsResponse.posts.nodes as Post[],
      categories: categories as PostCategory[],
      pageInfo: postsResponse.posts.pageInfo,
    };
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return {
      posts: [],
      categories: [],
      pageInfo: { hasNextPage: false, hasPreviousPage: false },
    };
  }
};

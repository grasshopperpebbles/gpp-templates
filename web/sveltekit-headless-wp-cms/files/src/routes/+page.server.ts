import { getPosts, type Post } from "$lib/wordpress";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  try {
    const response = await getPosts({ first: 6 });
    return {
      posts: response.posts.nodes as Post[],
    };
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return {
      posts: [],
    };
  }
};

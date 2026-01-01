import { error } from "@sveltejs/kit";
import { getPostBySlug, type Post } from "$lib/wordpress";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  try {
    const post = await getPostBySlug(params.slug);

    if (!post) {
      throw error(404, "Post not found");
    }

    return {
      post: post as Post,
    };
  } catch (err) {
    if (err && typeof err === "object" && "status" in err) {
      throw err;
    }
    console.error("Failed to fetch post:", err);
    throw error(500, "Failed to load post");
  }
};

import { getProducts, type Product } from "$lib/woocommerce";
import { getPosts, type Post } from "$lib/wordpress";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  try {
    const [productsResponse, postsResponse] = await Promise.all([
      getProducts({ first: 4 }),
      getPosts({ first: 3 }),
    ]);

    return {
      products: productsResponse.products.nodes as Product[],
      posts: postsResponse.posts.nodes as Post[],
    };
  } catch (error) {
    console.error("Failed to fetch data:", error);
    return {
      products: [],
      posts: [],
    };
  }
};

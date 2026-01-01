import { getProductsByCategory, type Product } from "$lib/woocommerce";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  try {
    const response = await getProductsByCategory(params.slug, { first: 24 });

    const categoryName = response.products.nodes[0]?.productCategories?.nodes?.find(
      (c) => c.slug === params.slug
    )?.name || params.slug;

    return {
      products: response.products.nodes as Product[],
      categoryName,
      categorySlug: params.slug,
    };
  } catch (error) {
    console.error("Failed to fetch products by category:", error);
    return {
      products: [],
      categoryName: params.slug,
      categorySlug: params.slug,
    };
  }
};

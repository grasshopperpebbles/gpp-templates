import { getProducts, getProductCategories, type Product, type ProductCategory } from "$lib/woocommerce";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  try {
    const [productsResponse, categories] = await Promise.all([
      getProducts({ first: 24 }),
      getProductCategories(),
    ]);

    return {
      products: productsResponse.products.nodes as Product[],
      categories: categories as ProductCategory[],
    };
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return {
      products: [],
      categories: [],
    };
  }
};

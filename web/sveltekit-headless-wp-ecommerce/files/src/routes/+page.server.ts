import { getProducts, type Product } from "$lib/woocommerce";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  try {
    const response = await getProducts({ first: 8 });
    return {
      products: response.products.nodes as Product[],
    };
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return {
      products: [],
    };
  }
};

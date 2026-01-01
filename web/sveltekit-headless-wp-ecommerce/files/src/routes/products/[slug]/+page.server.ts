import { error } from "@sveltejs/kit";
import { getProductBySlug, type Product } from "$lib/woocommerce";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  try {
    const product = await getProductBySlug(params.slug);

    if (!product) {
      throw error(404, "Product not found");
    }

    return {
      product: product as Product,
    };
  } catch (err) {
    if (err && typeof err === "object" && "status" in err) {
      throw err;
    }
    console.error("Failed to fetch product:", err);
    throw error(500, "Failed to load product");
  }
};

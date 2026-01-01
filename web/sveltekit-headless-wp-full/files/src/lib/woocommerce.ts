import {
  graphqlClient,
  GET_PRODUCTS,
  GET_PRODUCT_BY_SLUG,
  GET_PRODUCT_CATEGORIES,
  GET_PRODUCTS_BY_CATEGORY,
  GET_CART,
  ADD_TO_CART,
  REMOVE_FROM_CART,
  UPDATE_CART_QUANTITY,
  type Product,
  type ProductCategory,
  type Cart,
} from "./graphql";

interface ProductsResponse {
  products: {
    nodes: Product[];
    pageInfo: {
      hasNextPage: boolean;
      endCursor?: string;
    };
  };
}

interface ProductResponse {
  product: Product;
}

interface CategoriesResponse {
  productCategories: {
    nodes: ProductCategory[];
  };
}

interface CartResponse {
  cart: Cart;
}

interface AddToCartResponse {
  addToCart: {
    cart: Cart;
  };
}

interface RemoveFromCartResponse {
  removeItemsFromCart: {
    cart: Cart;
  };
}

interface UpdateCartResponse {
  updateItemQuantities: {
    cart: Cart;
  };
}

export async function getProducts(options: { first?: number; after?: string } = {}): Promise<ProductsResponse> {
  const { first = 12, after } = options;
  return graphqlClient.query<ProductsResponse>(GET_PRODUCTS, { first, after });
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const response = await graphqlClient.query<ProductResponse>(GET_PRODUCT_BY_SLUG, { slug });
    return response.product;
  } catch (error) {
    console.error(`Error fetching product with slug "${slug}":`, error);
    return null;
  }
}

export async function getProductCategories(): Promise<ProductCategory[]> {
  try {
    const response = await graphqlClient.query<CategoriesResponse>(GET_PRODUCT_CATEGORIES);
    return response.productCategories.nodes;
  } catch (error) {
    console.error("Error fetching product categories:", error);
    return [];
  }
}

export async function getProductsByCategory(
  categorySlug: string,
  options: { first?: number } = {}
): Promise<ProductsResponse> {
  const { first = 12 } = options;
  return graphqlClient.query<ProductsResponse>(GET_PRODUCTS_BY_CATEGORY, {
    categorySlug,
    first,
  });
}

export async function getCart(): Promise<Cart> {
  try {
    const response = await graphqlClient.query<CartResponse>(GET_CART);
    return response.cart;
  } catch (error) {
    console.error("Error fetching cart:", error);
    return {
      contents: { nodes: [] },
      subtotal: "$0.00",
      total: "$0.00",
      isEmpty: true,
    };
  }
}

export async function addToCart(productId: number, quantity: number = 1): Promise<Cart> {
  const response = await graphqlClient.query<AddToCartResponse>(ADD_TO_CART, {
    productId,
    quantity,
  });
  return response.addToCart.cart;
}

export async function removeFromCart(keys: string[]): Promise<Cart> {
  const response = await graphqlClient.query<RemoveFromCartResponse>(REMOVE_FROM_CART, {
    keys,
  });
  return response.removeItemsFromCart.cart;
}

export async function updateCartQuantity(
  items: Array<{ key: string; quantity: number }>
): Promise<Cart> {
  const response = await graphqlClient.query<UpdateCartResponse>(UPDATE_CART_QUANTITY, {
    items,
  });
  return response.updateItemQuantities.cart;
}

export { type Product, type ProductCategory, type Cart };

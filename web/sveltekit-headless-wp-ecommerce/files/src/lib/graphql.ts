import { config } from "./config";

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
  }>;
}

class GraphQLClient {
  private endpoint: string;
  private sessionToken: string | null = null;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  setSessionToken(token: string | null) {
    this.sessionToken = token;
  }

  async query<T>(
    query: string,
    variables?: Record<string, unknown>
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.sessionToken) {
      headers["woocommerce-session"] = `Session ${this.sessionToken}`;
    }

    const response = await fetch(this.endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables }),
    });

    const sessionHeader = response.headers.get("woocommerce-session");
    if (sessionHeader) {
      this.sessionToken = sessionHeader;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: GraphQLResponse<T> = await response.json();

    if (result.errors) {
      throw new Error(result.errors[0]?.message || "GraphQL error");
    }

    if (!result.data) {
      throw new Error("No data returned from GraphQL query");
    }

    return result.data;
  }
}

export const graphqlClient = new GraphQLClient(config.graphqlEndpoint);

// Product Types
export interface Product {
  id: string;
  databaseId: number;
  name: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  price?: string;
  regularPrice?: string;
  salePrice?: string;
  onSale: boolean;
  stockStatus: string;
  image?: {
    sourceUrl: string;
    altText?: string;
  };
  galleryImages?: {
    nodes: Array<{
      sourceUrl: string;
      altText?: string;
    }>;
  };
  productCategories?: {
    nodes: Array<{
      id: string;
      name: string;
      slug: string;
    }>;
  };
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: {
    sourceUrl: string;
    altText?: string;
  };
  count: number;
}

export interface CartItem {
  key: string;
  quantity: number;
  product: {
    node: {
      id: string;
      databaseId: number;
      name: string;
      slug: string;
      price: string;
      image?: {
        sourceUrl: string;
        altText?: string;
      };
    };
  };
}

export interface Cart {
  contents: {
    nodes: CartItem[];
  };
  subtotal: string;
  total: string;
  isEmpty: boolean;
}

// GraphQL Queries
export const GET_PRODUCTS = `
  query GetProducts($first: Int, $after: String) {
    products(first: $first, after: $after) {
      nodes {
        id
        databaseId
        name
        slug
        shortDescription
        onSale
        image {
          sourceUrl
          altText
        }
        ... on SimpleProduct {
          price
          regularPrice
          salePrice
          stockStatus
        }
        ... on VariableProduct {
          price
          regularPrice
          salePrice
          stockStatus
        }
        productCategories {
          nodes {
            id
            name
            slug
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const GET_PRODUCT_BY_SLUG = `
  query GetProductBySlug($slug: ID!) {
    product(id: $slug, idType: SLUG) {
      id
      databaseId
      name
      slug
      shortDescription
      description
      onSale
      image {
        sourceUrl
        altText
      }
      galleryImages {
        nodes {
          sourceUrl
          altText
        }
      }
      ... on SimpleProduct {
        price
        regularPrice
        salePrice
        stockStatus
        stockQuantity
      }
      ... on VariableProduct {
        price
        regularPrice
        salePrice
        stockStatus
        stockQuantity
      }
      productCategories {
        nodes {
          id
          name
          slug
        }
      }
    }
  }
`;

export const GET_PRODUCT_CATEGORIES = `
  query GetProductCategories {
    productCategories(first: 100, where: { hideEmpty: false }) {
      nodes {
        id
        name
        slug
        description
        image {
          sourceUrl
          altText
        }
        count
      }
    }
  }
`;

export const GET_PRODUCTS_BY_CATEGORY = `
  query GetProductsByCategory($categorySlug: String!, $first: Int) {
    products(first: $first, where: { category: $categorySlug }) {
      nodes {
        id
        databaseId
        name
        slug
        shortDescription
        onSale
        image {
          sourceUrl
          altText
        }
        ... on SimpleProduct {
          price
          regularPrice
          salePrice
          stockStatus
        }
        ... on VariableProduct {
          price
          regularPrice
          salePrice
          stockStatus
        }
        productCategories {
          nodes {
            id
            name
            slug
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const GET_CART = `
  query GetCart {
    cart {
      contents {
        nodes {
          key
          quantity
          product {
            node {
              id
              databaseId
              name
              slug
              ... on SimpleProduct {
                price
              }
              image {
                sourceUrl
                altText
              }
            }
          }
        }
      }
      subtotal
      total
      isEmpty
    }
  }
`;

export const ADD_TO_CART = `
  mutation AddToCart($productId: Int!, $quantity: Int) {
    addToCart(input: { productId: $productId, quantity: $quantity }) {
      cart {
        contents {
          nodes {
            key
            quantity
            product {
              node {
                id
                databaseId
                name
                slug
                ... on SimpleProduct {
                  price
                }
                image {
                  sourceUrl
                  altText
                }
              }
            }
          }
        }
        subtotal
        total
        isEmpty
      }
    }
  }
`;

export const REMOVE_FROM_CART = `
  mutation RemoveFromCart($keys: [ID]) {
    removeItemsFromCart(input: { keys: $keys }) {
      cart {
        contents {
          nodes {
            key
            quantity
            product {
              node {
                id
                databaseId
                name
                slug
                ... on SimpleProduct {
                  price
                }
                image {
                  sourceUrl
                  altText
                }
              }
            }
          }
        }
        subtotal
        total
        isEmpty
      }
    }
  }
`;

export const UPDATE_CART_QUANTITY = `
  mutation UpdateCartQuantity($items: [CartItemQuantityInput]) {
    updateItemQuantities(input: { items: $items }) {
      cart {
        contents {
          nodes {
            key
            quantity
            product {
              node {
                id
                databaseId
                name
                slug
                ... on SimpleProduct {
                  price
                }
                image {
                  sourceUrl
                  altText
                }
              }
            }
          }
        }
        subtotal
        total
        isEmpty
      }
    }
  }
`;

interface GraphQLResponse<T> {
  data?: T
  errors?: Array<{
    message: string
    locations?: Array<{ line: number; column: number }>
    path?: string[]
  }>
}

export class GraphQLClient {
  private endpoint: string
  private sessionToken: string | null = null

  constructor(endpoint: string) {
    this.endpoint = endpoint
  }

  setSessionToken(token: string | null) {
    this.sessionToken = token
  }

  getSessionToken(): string | null {
    return this.sessionToken
  }

  async query<T>(
    query: string,
    variables?: Record<string, unknown>,
    fetchOptions?: RequestInit
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Add WooCommerce session token if available
    if (this.sessionToken) {
      headers['woocommerce-session'] = `Session ${this.sessionToken}`
    }

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query,
        variables,
      }),
      ...fetchOptions, // Spread Next.js fetch options (cache, next.revalidate, etc.)
    })

    // Extract and store session token from response
    const sessionHeader = response.headers.get('woocommerce-session')
    if (sessionHeader) {
      this.sessionToken = sessionHeader
      // Store in localStorage for persistence (client-side only)
      if (typeof window !== 'undefined') {
        localStorage.setItem('woocommerce-session', sessionHeader)
      }
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result: GraphQLResponse<T> = await response.json()

    if (result.errors) {
      throw new Error(result.errors[0]?.message || 'GraphQL error')
    }

    if (!result.data) {
      throw new Error('No data returned from GraphQL query')
    }

    return result.data
  }
}

export const graphqlClient = new GraphQLClient(
  process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:8080/graphql'
)

// Lightweight query for search suggestions
export const GET_PRODUCTS_FOR_SEARCH = `
  query GetProductsForSearch($first: Int) {
    products(first: $first) {
      nodes {
        id
        name
        slug
        productCategories {
          nodes {
            name
            slug
          }
        }
      }
    }
  }
`

// Product queries
export const GET_PRODUCTS = `
  query GetProducts($first: Int, $after: String) {
    products(first: $first, after: $after) {
      nodes {
        id
        databaseId
        name
        slug
        shortDescription
        description
        onSale
        image {
          id
          sourceUrl
          altText
        }
        ... on SimpleProduct {
          date
          price
          regularPrice
          salePrice
          stockStatus
          stockQuantity
          galleryImages {
            nodes {
              id
              sourceUrl
              altText
            }
          }
          productCategories {
            nodes {
              id
              name
              slug
              parent {
                node {
                  id
                  name
                  slug
                }
              }
            }
          }
        }
        ... on VariableProduct {
          date
          price
          regularPrice
          salePrice
          stockStatus
          stockQuantity
          galleryImages {
            nodes {
              id
              sourceUrl
              altText
            }
          }
          productCategories {
            nodes {
              id
              name
              slug
              parent {
                node {
                  id
                  name
                  slug
                }
              }
            }
          }
        }
        ... on ExternalProduct {
          date
          price
          regularPrice
          salePrice
          galleryImages {
            nodes {
              id
              sourceUrl
              altText
            }
          }
          productCategories {
            nodes {
              id
              name
              slug
              parent {
                node {
                  id
                  name
                  slug
                }
              }
            }
          }
        }
        ... on GroupProduct {
          date
          price
          productCategories {
            nodes {
              id
              name
              slug
              parent {
                node {
                  id
                  name
                  slug
                }
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`

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
        id
        sourceUrl
        altText
      }
      ... on SimpleProduct {
        sku
        weight
        length
        width
        height
        date
        price
        regularPrice
        salePrice
        stockStatus
        stockQuantity
        galleryImages {
          nodes {
            id
            sourceUrl
            altText
          }
        }
        productCategories {
          nodes {
            id
            name
            slug
          }
        }
        attributes {
          nodes {
            id
            name
            slug
            options
          }
        }
      }
      ... on VariableProduct {
        sku
        weight
        length
        width
        height
        date
        price
        regularPrice
        salePrice
        stockStatus
        stockQuantity
        galleryImages {
          nodes {
            id
            sourceUrl
            altText
          }
        }
        productCategories {
          nodes {
            id
            name
            slug
          }
        }
        attributes {
          nodes {
            id
            name
            slug
            options
          }
        }
      }
      ... on ExternalProduct {
        date
        price
        regularPrice
        salePrice
        galleryImages {
          nodes {
            id
            sourceUrl
            altText
          }
        }
        productCategories {
          nodes {
            id
            name
            slug
          }
        }
      }
      ... on GroupProduct {
        date
        price
        productCategories {
          nodes {
            id
            name
            slug
          }
        }
      }
      related {
        nodes {
          id
          name
          slug
          ... on SimpleProduct {
            price
          }
          ... on VariableProduct {
            price
          }
          ... on ExternalProduct {
            price
          }
          ... on GroupProduct {
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
`

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
        parent {
          node {
            id
            name
            slug
          }
        }
        children {
          nodes {
            id
            name
            slug
            count
          }
        }
      }
    }
  }
`

export const SEARCH_PRODUCTS = `
  query SearchProducts($search: String!, $first: Int) {
    products(where: { search: $search }, first: $first) {
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
          date
          price
          regularPrice
          salePrice
          productCategories {
            nodes {
              name
              slug
            }
          }
        }
        ... on VariableProduct {
          date
          price
          regularPrice
          salePrice
          productCategories {
            nodes {
              name
              slug
            }
          }
        }
        ... on ExternalProduct {
          date
          price
          regularPrice
          salePrice
          productCategories {
            nodes {
              name
              slug
            }
          }
        }
        ... on GroupProduct {
          date
          price
          productCategories {
            nodes {
              name
              slug
            }
          }
        }
      }
    }
  }
`

// Review/Rating related queries
export const GET_PRODUCT_REVIEWS = `
  query GetProductReviews($productId: Int!, $first: Int = 10) {
    comments(where: { 
      parent: 0, 
      commentType: "review", 
      contentId: $productId 
    }, first: $first) {
      nodes {
        id
        databaseId
        content
        date
        author {
          node {
            name
          }
        }
        commentedOn {
          node {
            ... on Product {
              id
            }
          }
        }
      }
    }
  }
`

export const GET_PRODUCT_WITH_REVIEWS = `
  query GetProductWithReviews($slug: ID!) {
    product(id: $slug, idType: SLUG) {
      id
      databaseId
      name
      slug
      shortDescription
      description
      onSale
      reviewCount
      averageRating
      image {
        id
        sourceUrl
        altText
      }
      reviews {
        edges {
          rating
          node {
            id
            databaseId
            content
            date
            author {
              node {
                name
              }
            }
          }
        }
      }
      ... on SimpleProduct {
        sku
        weight
        length
        width
        height
        date
        price
        regularPrice
        salePrice
        stockStatus
        stockQuantity
        galleryImages {
          nodes {
            id
            sourceUrl
            altText
          }
        }
        productCategories {
          nodes {
            id
            name
            slug
          }
        }
        attributes {
          nodes {
            id
            name
            slug
            options
          }
        }
      }
      ... on VariableProduct {
        sku
        weight
        length
        width
        height
        date
        price
        regularPrice
        salePrice
        stockStatus
        stockQuantity
        galleryImages {
          nodes {
            id
            sourceUrl
            altText
          }
        }
        productCategories {
          nodes {
            id
            name
            slug
          }
        }
        attributes {
          nodes {
            id
            name
            slug
            options
          }
        }
        variations {
          nodes {
            id
            databaseId
            name
            price
            regularPrice
            salePrice
            stockStatus
            stockQuantity
            attributes {
              nodes {
                name
                value
              }
            }
          }
        }
      }
      related {
        nodes {
          id
          name
          slug
          price
          regularPrice
          salePrice
          onSale
          image {
            sourceUrl
            altText
          }
        }
      }
    }
  }
`

// Types for GraphQL responses
export interface Review {
  id: string
  databaseId: number
  content: string
  date: string
  rating: number
  author: {
    node: {
      name: string
    }
  }
}

export interface ReviewEdge {
  rating: number
  node: Review
}

export interface Product {
  id: string
  databaseId: number
  name: string
  slug: string
  shortDescription?: string
  description?: string
  price?: string
  regularPrice?: string
  salePrice?: string
  onSale: boolean
  date?: string
  stockStatus: string
  stockQuantity?: number
  sku?: string
  weight?: string
  length?: string
  width?: string
  height?: string
  reviewCount?: number
  averageRating?: number
  image?: {
    id: string
    sourceUrl: string
    altText?: string
  }
  galleryImages?: {
    nodes: Array<{
      id: string
      sourceUrl: string
      altText?: string
    }>
  }
  productCategories?: {
    nodes: Array<{
      id: string
      name: string
      slug: string
      parent?: {
        node: {
          id: string
          name: string
          slug: string
        }
      }
    }>
  }
  attributes?: {
    nodes: Array<{
      id: string
      name: string
      slug?: string
      options: string[]
    }>
  }
  related?: {
    nodes: Product[]
  }
  reviews?: {
    edges: ReviewEdge[]
  }
}

export interface ProductCategory {
  id: string
  name: string
  slug: string
  description?: string
  image?: {
    sourceUrl: string
    altText?: string
  }
  count: number
  parent?: {
    node: {
      id: string
      name: string
      slug: string
    }
  }
  children?: {
    nodes: Array<{
      id: string
      name: string
      slug: string
      count: number
    }>
  }
}

export interface ProductsResponse {
  products: {
    nodes: Product[]
    pageInfo: {
      hasNextPage: boolean
      hasPreviousPage: boolean
      startCursor?: string
      endCursor?: string
    }
  }
}

export interface ProductResponse {
  product: Product
}

export interface CategoriesResponse {
  productCategories: {
    nodes: ProductCategory[]
  }
}

// Featured Items ACF Types
export interface FeaturedItemsSettings {
  featuredTitle: string
  featuredDescription: string
  featuredItems: {
    nodes: Product[]
  } | null
}

export interface SiteSetting {
  id: string
  databaseId: number
  title: string
  featuredItems: FeaturedItemsSettings
}

export interface FeaturedItemsResponse {
  siteSettings: {
    nodes: SiteSetting[]
  }
}

// Query for Featured Items Settings
export const GET_FEATURED_ITEMS = `
  query GetFeaturedItems {
    siteSettings(first: 1) {
      nodes {
        id
        databaseId
        title
        featuredItems {
          featuredTitle
          featuredDescription
          featuredItems {
            nodes {
              ... on Product {
                id
                databaseId
                name
                slug
                type
                onSale
                shortDescription
                ... on SimpleProduct {
                  price
                  regularPrice
                  salePrice
                  stockStatus
                }
                image {
                  id
                  sourceUrl
                  altText
                }
                productCategories {
                  nodes {
                    id
                    name
                    slug
                    parent {
                      node {
                        id
                        name
                        slug
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`

// Most Popular Items Types
export interface MostPopularSettings {
  popularTitle: string
  popularDescription: string
  popularItemsResolved: Product[]
}

export interface PopularSetting {
  id: string
  databaseId: number
  title: string
  mostPopular: MostPopularSettings
}

export interface MostPopularResponse {
  popularSettings: {
    nodes: PopularSetting[]
  }
}

// Query for Most Popular Items (with smart fallback to best-sellers)
export const GET_MOST_POPULAR = `
  query GetMostPopular {
    popularSettings(first: 1) {
      nodes {
        id
        databaseId
        title
        mostPopular {
          popularTitle
          popularDescription
          popularItemsResolved {
            id
            databaseId
            name
            slug
            type
            onSale
            shortDescription
            ... on SimpleProduct {
              price
              regularPrice
              salePrice
              stockStatus
            }
            image {
              id
              sourceUrl
              altText
            }
            productCategories {
              nodes {
                id
                name
                slug
                parent {
                  node {
                    id
                    name
                    slug
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`
// Page queries
export const GET_PAGE_BY_SLUG = `
  query GetPageBySlug($slug: ID!) {
    page(id: $slug, idType: URI) {
      id
      databaseId
      title
      content
      slug
      date
      modified
    }
  }
`

// Page Types
export interface Page {
  id: string
  databaseId: number
  title: string
  content: string
  slug: string
  date: string
  modified: string
}

export interface PageResponse {
  page: Page
}
// ============================================================================
// CART TYPES, QUERIES & MUTATIONS
// ============================================================================

// Cart Types
export interface CartItem {
  key: string
  quantity: number
  product: {
    node: {
      id: string
      databaseId: number
      name: string
      slug: string
      price: string
      regularPrice: string
      salePrice: string | null
      stockStatus: string
      stockQuantity: number | null
      image: {
        id: string
        sourceUrl: string | null
        altText: string | null
      } | null
    }
  }
}

export interface AppliedCoupon {
  code: string
  discountAmount: string
  discountTax: string
}

export interface Cart {
  contents: {
    nodes: CartItem[]
  }
  appliedCoupons: AppliedCoupon[] | null
  discountTotal: string
  discountTax: string
  subtotal: string
  subtotalTax: string
  shippingTotal: string
  shippingTax: string
  total: string
  totalTax: string
  isEmpty: boolean
}

export interface CartResponse {
  cart: Cart
}

export interface AddToCartResponse {
  addToCart: {
    cart: Cart
  }
}

export interface UpdateItemQuantitiesResponse {
  updateItemQuantities: {
    cart: Cart
  }
}

export interface RemoveItemsFromCartResponse {
  removeItemsFromCart: {
    cart: Cart
  }
}

export interface EmptyCartResponse {
  emptyCart: {
    cart: Cart
  }
}

export interface ApplyCouponResponse {
  applyCoupon: {
    cart: Cart
  }
}

export interface RemoveCouponsResponse {
  removeCoupons: {
    cart: Cart
  }
}

// Cart fragment for consistent fields across queries/mutations
const CART_FIELDS = `
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
            regularPrice
            salePrice
            stockStatus
            stockQuantity
          }
          image {
            id
            sourceUrl
            altText
          }
        }
      }
    }
  }
  appliedCoupons {
    code
    discountAmount
    discountTax
  }
  discountTotal
  discountTax
  subtotal
  subtotalTax
  shippingTotal
  shippingTax
  total
  totalTax
  isEmpty
`

// Cart Queries
export const GET_CART = `
  query GetCart {
    cart {
      ${CART_FIELDS}
    }
  }
`

// Cart Mutations
export const ADD_TO_CART = `
  mutation AddToCart($productId: Int!, $quantity: Int) {
    addToCart(input: { productId: $productId, quantity: $quantity }) {
      cart {
        ${CART_FIELDS}
      }
    }
  }
`

export const UPDATE_ITEM_QUANTITIES = `
  mutation UpdateItemQuantities($items: [CartItemQuantityInput]) {
    updateItemQuantities(input: { items: $items }) {
      cart {
        ${CART_FIELDS}
      }
    }
  }
`

export const REMOVE_ITEMS_FROM_CART = `
  mutation RemoveItemsFromCart($keys: [ID]) {
    removeItemsFromCart(input: { keys: $keys }) {
      cart {
        ${CART_FIELDS}
      }
    }
  }
`

export const EMPTY_CART = `
  mutation EmptyCart {
    emptyCart(input: {}) {
      cart {
        ${CART_FIELDS}
      }
    }
  }
`

// Coupon Mutations
export const APPLY_COUPON = `
  mutation ApplyCoupon($code: String!) {
    applyCoupon(input: { code: $code }) {
      cart {
        ${CART_FIELDS}
      }
    }
  }
`

export const REMOVE_COUPONS = `
  mutation RemoveCoupons($codes: [String!]!) {
    removeCoupons(input: { codes: $codes }) {
      cart {
        ${CART_FIELDS}
      }
    }
  }
`

// ============================================================================
// BLOG POST TYPES, QUERIES & UTILITIES
// ============================================================================

// Post Types
export interface Post {
  id: string
  databaseId: number
  title: string
  slug: string
  content: string
  excerpt: string
  date: string
  modified: string
  author: {
    node: {
      id: string
      name: string
      slug: string
      avatar?: {
        url: string
      }
    }
  }
  featuredImage?: {
    node: {
      sourceUrl: string
      altText?: string
      mediaDetails?: {
        width: number
        height: number
      }
    }
  }
  categories?: {
    nodes: Array<{
      id: string
      name: string
      slug: string
      parent?: {
        node: {
          id: string
          name: string
          slug: string
        }
      }
    }>
  }
  tags?: {
    nodes: Array<{
      id: string
      name: string
      slug: string
    }>
  }
  seo?: {
    title?: string
    metaDesc?: string
    opengraphTitle?: string
    opengraphDescription?: string
    opengraphImage?: {
      sourceUrl: string
    }
    canonical?: string
  }
}

export interface PostCategory {
  id: string
  name: string
  slug: string
  description?: string
  count: number
  parent?: {
    node: {
      id: string
      name: string
      slug: string
    }
  }
}

export interface PostTag {
  id: string
  name: string
  slug: string
  description?: string
  count: number
}

export interface PostsResponse {
  posts: {
    nodes: Post[]
    pageInfo: {
      hasNextPage: boolean
      hasPreviousPage: boolean
      startCursor?: string
      endCursor?: string
    }
  }
}

export interface PostResponse {
  post: Post
}

export interface PostCategoriesResponse {
  categories: {
    nodes: PostCategory[]
  }
}

export interface PostTagsResponse {
  tags: {
    nodes: PostTag[]
  }
}

// Post Queries
export const GET_POSTS = `
  query GetPosts($first: Int, $after: String, $category: String, $tag: String) {
    posts(
      first: $first
      after: $after
      where: {
        categoryName: $category
        tag: $tag
      }
    ) {
      nodes {
        id
        databaseId
        title
        slug
        excerpt
        date
        modified
        author {
          node {
            name
            slug
            avatar {
              url
            }
          }
        }
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        categories {
          nodes {
            id
            name
            slug
            parent {
              node {
                id
                name
                slug
              }
            }
          }
        }
        tags {
          nodes {
            id
            name
            slug
          }
        }
        seo {
          title
          metaDesc
          opengraphImage {
            sourceUrl
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`

export const GET_POST_BY_SLUG = `
  query GetPostBySlug($slug: ID!) {
    post(id: $slug, idType: SLUG) {
      id
      databaseId
      title
      content
      excerpt
      date
      modified
      author {
        node {
          id
          name
          slug
          avatar {
            url
          }
        }
      }
      featuredImage {
        node {
          sourceUrl
          altText
          mediaDetails {
            width
            height
          }
        }
      }
      categories {
        nodes {
          id
          name
          slug
          parent {
            node {
              id
              name
              slug
            }
          }
        }
      }
      tags {
        nodes {
          id
          name
          slug
        }
      }
      seo {
        title
        metaDesc
        opengraphTitle
        opengraphDescription
        opengraphImage {
          sourceUrl
        }
        canonical
      }
    }
  }
`

export const GET_POST_CATEGORIES = `
  query GetPostCategories {
    categories(first: 100, where: { hideEmpty: true }) {
      nodes {
        id
        name
        slug
        description
        count
        parent {
          node {
            id
            name
            slug
          }
        }
      }
    }
  }
`

export const GET_POST_TAGS = `
  query GetPostTags {
    tags(first: 100, where: { hideEmpty: true }) {
      nodes {
        id
        name
        slug
        description
        count
      }
    }
  }
`

export const SEARCH_POSTS = `
  query SearchPosts($search: String!, $first: Int) {
    posts(where: { search: $search }, first: $first) {
      nodes {
        id
        title
        slug
        excerpt
        date
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        categories {
          nodes {
            name
            slug
          }
        }
      }
    }
  }
`

export const GET_RECENT_POSTS = `
  query GetRecentPosts($first: Int = 5) {
    posts(first: $first) {
      nodes {
        id
        title
        slug
        date
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
      }
    }
  }
`

export const GET_POSTS_BY_CATEGORY = `
  query GetPostsByCategory($categorySlug: String!, $first: Int, $after: String) {
    posts(
      first: $first
      after: $after
      where: { categoryName: $categorySlug }
    ) {
      nodes {
        id
        databaseId
        title
        slug
        excerpt
        date
        author {
          node {
            name
            slug
          }
        }
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        categories {
          nodes {
            id
            name
            slug
            parent {
              node {
                id
                name
                slug
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`

export const GET_POSTS_BY_TAG = `
  query GetPostsByTag($tagSlug: String!, $first: Int, $after: String) {
    posts(
      first: $first
      after: $after
      where: { tag: $tagSlug }
    ) {
      nodes {
        id
        databaseId
        title
        slug
        excerpt
        date
        author {
          node {
            name
            slug
          }
        }
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        tags {
          nodes {
            id
            name
            slug
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`

export const GET_POSTS_BY_AUTHOR = `
  query GetPostsByAuthor($authorSlug: String!, $first: Int, $after: String) {
    posts(
      first: $first
      after: $after
      where: { authorName: $authorSlug }
    ) {
      nodes {
        id
        databaseId
        title
        slug
        excerpt
        date
        author {
          node {
            name
            slug
            avatar {
              url
            }
          }
        }
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`

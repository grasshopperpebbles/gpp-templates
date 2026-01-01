import {
  graphqlClient,
  GET_PRODUCTS,
  GET_PRODUCT_CATEGORIES,
  GET_RECENT_POSTS,
  GET_POST_CATEGORIES,
  type ProductsResponse,
  type CategoriesResponse,
  type Post,
  type PostCategory,
} from '@/lib/graphql'
import { getSiteOptions } from '@/lib/site-options'
import { SITE_CONFIG } from '@/lib/config'
import {
  EcommerceCMSHomepage,
} from '@/components/homepage'

export const revalidate = 60 // ISR: revalidate every 60 seconds

// Determine which data to fetch based on site type
type HomepageData = {
  siteOptions: Awaited<ReturnType<typeof getSiteOptions>>
  featuredProducts: ProductsResponse['products']['nodes']
  popularProducts: ProductsResponse['products']['nodes']
  productCategories: CategoriesResponse['productCategories']['nodes']
  recentPosts: Post[]
  postCategories: PostCategory[]
}

async function fetchHomepageData(): Promise<HomepageData> {
  const siteOptions = await getSiteOptions()
  const siteType = siteOptions.siteType || 'ecommerce_cms'

  // Fetch data based on site type
  const needsProducts = siteType !== 'cms_only'
  const needsPosts = siteType !== 'ecommerce_only'

  const [productsData, categoriesData, postsData, postCategoriesData] = await Promise.all([
    // Fetch products if needed
    needsProducts
      ? graphqlClient.query<ProductsResponse>(
          GET_PRODUCTS,
          { first: 12 },
          { next: { revalidate: 60, tags: ['products'] } }
        )
      : Promise.resolve({ products: { nodes: [], pageInfo: { hasNextPage: false, endCursor: null } } }),

    // Fetch product categories if needed
    needsProducts
      ? graphqlClient.query<CategoriesResponse>(
          GET_PRODUCT_CATEGORIES,
          {},
          { next: { revalidate: 300, tags: ['categories'] } }
        )
      : Promise.resolve({ productCategories: { nodes: [] } }),

    // Fetch recent posts if needed
    needsPosts
      ? graphqlClient
          .query<{ posts: { nodes: Post[] } }>(
            GET_RECENT_POSTS,
            { first: 10 },
            { next: { revalidate: 60, tags: ['posts'] } }
          )
          .catch(() => ({ posts: { nodes: [] } }))
      : Promise.resolve({ posts: { nodes: [] } }),

    // Fetch post categories if needed
    needsPosts
      ? graphqlClient
          .query<{ categories: { nodes: PostCategory[] } }>(
            GET_POST_CATEGORIES,
            {},
            { next: { revalidate: 300, tags: ['post-categories'] } }
          )
          .catch(() => ({ categories: { nodes: [] } }))
      : Promise.resolve({ categories: { nodes: [] } }),
  ])

  return {
    siteOptions,
    featuredProducts: productsData.products.nodes,
    popularProducts: productsData.products.nodes.slice(0, 4),
    productCategories: categoriesData.productCategories.nodes,
    recentPosts: postsData.posts.nodes,
    postCategories: postCategoriesData.categories.nodes,
  }
}

export default async function HomePage() {
  const data = await fetchHomepageData()
  const { siteOptions } = data

  const siteName = SITE_CONFIG.name
  const siteTagline = SITE_CONFIG.description

  return (
    <EcommerceCMSHomepage
      siteName={siteName}
      siteTagline={siteTagline}
      
      featuredProducts={data.featuredProducts}
      popularProducts={data.popularProducts}
      categories={data.productCategories}
      recentPosts={data.recentPosts}
      
    />
  )
}

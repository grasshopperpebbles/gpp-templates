/**
 * Post utility functions for headless CMS
 *
 * Provides helper functions for fetching blog posts, categories, and tags
 * via GraphQL from WordPress.
 */

import {
  graphqlClient,
  GET_POSTS,
  GET_POST_BY_SLUG,
  GET_POST_CATEGORIES,
  GET_POST_TAGS,
  SEARCH_POSTS,
  GET_RECENT_POSTS,
  GET_POSTS_BY_CATEGORY,
  GET_POSTS_BY_TAG,
  GET_POSTS_BY_AUTHOR,
  type Post,
  type PostCategory,
  type PostTag,
  type PostsResponse,
  type PostResponse,
  type PostCategoriesResponse,
  type PostTagsResponse,
} from './graphql'

// ============================================================================
// POST FETCHING FUNCTIONS
// ============================================================================

export interface GetPostsOptions {
  first?: number
  after?: string
  category?: string
  tag?: string
}

/**
 * Fetch paginated list of posts
 */
export async function getPosts(options: GetPostsOptions = {}): Promise<PostsResponse> {
  const { first = 10, after, category, tag } = options

  return graphqlClient.query<PostsResponse>(GET_POSTS, {
    first,
    after,
    category,
    tag,
  })
}

/**
 * Fetch a single post by slug
 */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const response = await graphqlClient.query<PostResponse>(GET_POST_BY_SLUG, {
      slug,
    })
    return response.post
  } catch (error) {
    console.error(`Error fetching post with slug "${slug}":`, error)
    return null
  }
}

/**
 * Fetch recent posts (for sidebar, footer, etc.)
 */
export async function getRecentPosts(count: number = 5): Promise<Post[]> {
  try {
    const response = await graphqlClient.query<{ posts: { nodes: Post[] } }>(
      GET_RECENT_POSTS,
      { first: count }
    )
    return response.posts.nodes
  } catch (error) {
    console.error('Error fetching recent posts:', error)
    return []
  }
}

/**
 * Fetch posts by category slug
 */
export async function getPostsByCategory(
  categorySlug: string,
  options: { first?: number; after?: string } = {}
): Promise<PostsResponse> {
  const { first = 10, after } = options

  return graphqlClient.query<PostsResponse>(GET_POSTS_BY_CATEGORY, {
    categorySlug,
    first,
    after,
  })
}

/**
 * Fetch posts by tag slug
 */
export async function getPostsByTag(
  tagSlug: string,
  options: { first?: number; after?: string } = {}
): Promise<PostsResponse> {
  const { first = 10, after } = options

  return graphqlClient.query<PostsResponse>(GET_POSTS_BY_TAG, {
    tagSlug,
    first,
    after,
  })
}

/**
 * Fetch posts by author slug
 */
export async function getPostsByAuthor(
  authorSlug: string,
  options: { first?: number; after?: string } = {}
): Promise<PostsResponse> {
  const { first = 10, after } = options

  return graphqlClient.query<PostsResponse>(GET_POSTS_BY_AUTHOR, {
    authorSlug,
    first,
    after,
  })
}

// ============================================================================
// SEARCH FUNCTIONS
// ============================================================================

/**
 * Search posts by query string
 */
export async function searchPosts(
  query: string,
  limit: number = 10
): Promise<Post[]> {
  try {
    const response = await graphqlClient.query<{ posts: { nodes: Post[] } }>(
      SEARCH_POSTS,
      {
        search: query,
        first: limit,
      }
    )
    return response.posts.nodes
  } catch (error) {
    console.error(`Error searching posts for "${query}":`, error)
    return []
  }
}

// ============================================================================
// TAXONOMY FUNCTIONS
// ============================================================================

/**
 * Fetch all post categories
 */
export async function getCategories(): Promise<PostCategory[]> {
  try {
    const response = await graphqlClient.query<PostCategoriesResponse>(
      GET_POST_CATEGORIES
    )
    return response.categories.nodes
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

/**
 * Fetch all post tags
 */
export async function getTags(): Promise<PostTag[]> {
  try {
    const response = await graphqlClient.query<PostTagsResponse>(GET_POST_TAGS)
    return response.tags.nodes
  } catch (error) {
    console.error('Error fetching tags:', error)
    return []
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format a post date for display
 */
export function formatPostDate(dateString: string, locale: string = 'en-US'): string {
  const date = new Date(dateString)
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Calculate estimated reading time for a post
 */
export function calculateReadingTime(content: string): number {
  // Strip HTML tags
  const text = content.replace(/<[^>]*>/g, '')
  // Average reading speed: 200 words per minute
  const wordsPerMinute = 200
  const wordCount = text.split(/\s+/).filter(Boolean).length
  return Math.ceil(wordCount / wordsPerMinute)
}

/**
 * Generate excerpt from content if excerpt is empty
 */
export function generateExcerpt(content: string, maxLength: number = 160): string {
  // Strip HTML tags
  const text = content.replace(/<[^>]*>/g, '')
  // Truncate to maxLength
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).replace(/\s+\S*$/, '') + '...'
}

/**
 * Get primary category from a post
 */
export function getPrimaryCategory(post: Post): { name: string; slug: string } | null {
  if (!post.categories?.nodes?.length) return null
  return {
    name: post.categories.nodes[0].name,
    slug: post.categories.nodes[0].slug,
  }
}

/**
 * Build SEO metadata from post
 */
export function buildPostSEO(post: Post) {
  const seo = post.seo

  return {
    title: seo?.title || post.title,
    description: seo?.metaDesc || generateExcerpt(post.excerpt || post.content),
    openGraph: {
      title: seo?.opengraphTitle || seo?.title || post.title,
      description: seo?.opengraphDescription || seo?.metaDesc || generateExcerpt(post.excerpt || post.content),
      image: seo?.opengraphImage?.sourceUrl || post.featuredImage?.node?.sourceUrl,
      type: 'article',
      publishedTime: post.date,
      modifiedTime: post.modified,
      authors: [post.author?.node?.name],
    },
    canonical: seo?.canonical,
  }
}

/**
 * Generate Next.js Metadata object for a blog post
 * This function is designed to be used within a `generateMetadata` function in a page component.
 * 
 * @param post - The Post object from GraphQL
 * @param siteName - The site name (defaults to SITE_CONFIG.name)
 * @param siteUrl - The site URL (defaults to SITE_CONFIG.url)
 * @returns Next.js Metadata object
 */
export async function generatePostMetadata(
  post: Post,
  siteName?: string,
  siteUrl?: string
): Promise<import('next').Metadata> {
  const seo = post.seo
  const title = seo?.title || post.title
  const description = seo?.metaDesc || generateExcerpt(post.excerpt || post.content || '', 160)
  
  // Get site config if not provided
  const { SITE_CONFIG } = await import('./config')
  const finalSiteName = siteName || SITE_CONFIG.name
  const finalSiteUrl = siteUrl || SITE_CONFIG.url
  
  const canonicalUrl = seo?.canonical || `${finalSiteUrl}/blog/${post.slug}`
  
  // Get featured image or OG image
  const ogImage = seo?.opengraphImage?.sourceUrl || post.featuredImage?.node?.sourceUrl
  const images = ogImage ? [{ url: ogImage, alt: title }] : []
  
  // Get tags for keywords
  const keywords = post.tags?.nodes?.map(tag => tag.name) || []
  
  return {
    title: title,
    description: description,
    keywords: keywords.length > 0 ? keywords : undefined,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: seo?.opengraphTitle || title,
      description: seo?.opengraphDescription || description,
      url: canonicalUrl,
      siteName: finalSiteName,
      type: 'article',
      publishedTime: post.date,
      modifiedTime: post.modified,
      authors: post.author?.node?.name ? [post.author.node.name] : [],
      images: images,
    },
    twitter: {
      card: 'summary_large_image',
      title: seo?.opengraphTitle || title,
      description: seo?.opengraphDescription || description,
      images: ogImage ? [ogImage] : [],
    },
  }
}

// ============================================================================
// PAGINATION HELPERS
// ============================================================================

export interface PaginationInfo {
  hasNextPage: boolean
  hasPreviousPage: boolean
  startCursor?: string
  endCursor?: string
}

/**
 * Create pagination state from PageInfo
 */
export function createPaginationState(pageInfo: PaginationInfo) {
  return {
    canGoNext: pageInfo.hasNextPage,
    canGoPrevious: pageInfo.hasPreviousPage,
    nextCursor: pageInfo.endCursor,
    previousCursor: pageInfo.startCursor,
  }
}

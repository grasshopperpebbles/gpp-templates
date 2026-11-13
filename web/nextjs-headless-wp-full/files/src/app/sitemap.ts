// gpp:seo-rank-math
// sitemap.xml built from WordPress posts, with URLs on this site. Added by `gpp add seo rank-math`.
// WordPress permalinks match the Next.js routes, so a post's `uri` is its path here.
import type { MetadataRoute } from 'next'

export const revalidate = 3600

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '')
const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:8080/graphql'
const PAGE_SIZE = 100
const MAX_PAGES = 500 // 50,000 URLs, the sitemap protocol's limit for one file

const SITEMAP_POSTS = `
  query SitemapPosts($first: Int!, $after: String) {
    posts(first: $first, after: $after, where: { status: PUBLISH }) {
      pageInfo { hasNextPage endCursor }
      nodes { uri modifiedGmt seo { robots } }
    }
  }
`

interface SitemapPostsResponse {
  data?: {
    posts?: {
      pageInfo: { hasNextPage: boolean; endCursor: string | null }
      nodes: Array<{ uri?: string | null; modifiedGmt?: string | null; seo?: { robots?: string[] | null } | null }>
    }
  }
}

async function fetchPostUrls(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = []
  let after: string | null = null
  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: SITEMAP_POSTS, variables: { first: PAGE_SIZE, after } }),
      next: { revalidate },
    })
    if (!res.ok) throw new Error(`sitemap: GraphQL request failed (${res.status})`)
    const json = (await res.json()) as SitemapPostsResponse
    const posts = json.data?.posts
    if (!posts) break
    for (const post of posts.nodes) {
      if (!post.uri) continue
      // A post Rank Math marks noindex stays out of the sitemap.
      if (post.seo?.robots?.some((r) => r.toLowerCase() === 'noindex')) continue
      entries.push({
        url: SITE_URL + (post.uri.startsWith('/') ? post.uri : `/${post.uri}`),
        lastModified: post.modifiedGmt ? new Date(`${post.modifiedGmt}Z`) : undefined,
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    }
    if (!posts.pageInfo.hasNextPage || !posts.pageInfo.endCursor) break
    after = posts.pageInfo.endCursor
  }
  return entries
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const home: MetadataRoute.Sitemap = [{ url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1 }]
  try {
    return [...home, ...(await fetchPostUrls())]
  } catch (error) {
    console.error(error)
    return home
  }
}

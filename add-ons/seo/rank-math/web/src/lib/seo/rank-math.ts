// gpp:seo-rank-math
// Rank Math SEO (via WPGraphQL for Rank Math) for a headless WordPress + Next.js site.
// Added by `gpp add seo rank-math`. Builds Next.js metadata and JSON-LD from a post's `seo`
// field, falls back to the post's own title and excerpt, and rewrites WordPress URLs to the
// Next.js site (NEXT_PUBLIC_GRAPHQL_ENDPOINT origin -> NEXT_PUBLIC_SITE_URL).
import type { Metadata } from 'next'

/** GraphQL selection for a single post page. Use as: `seo { ${RANK_MATH_SEO_FIELDS} }`. */
export const RANK_MATH_SEO_FIELDS = `
  title
  description
  canonicalUrl
  robots
  focusKeywords
  breadcrumbs { text url isHidden }
  jsonLd { raw }
  openGraph {
    title
    description
    url
    type
    siteName
    updatedTime
    image { url secureUrl width height type }
    twitterMeta { card title description image site creator }
    articleMeta { publishedTime modifiedTime section tags author }
  }
`

/** GraphQL selection for post lists (cards only need title, description and image). */
export const RANK_MATH_SEO_LIST_FIELDS = `
  title
  description
  openGraph { image { url } }
`

export interface RankMathSeo {
  title?: string | null
  description?: string | null
  canonicalUrl?: string | null
  robots?: string[] | null
  focusKeywords?: string[] | null
  breadcrumbs?: Array<{ text?: string | null; url?: string | null; isHidden?: boolean | null }> | null
  jsonLd?: { raw?: string | null } | null
  openGraph?: {
    title?: string | null
    description?: string | null
    url?: string | null
    type?: string | null
    siteName?: string | null
    updatedTime?: string | null
    image?: { url?: string | null; secureUrl?: string | null; width?: number | null; height?: number | null; type?: string | null } | null
    twitterMeta?: { card?: string | null; title?: string | null; description?: string | null; image?: string | null; site?: string | null; creator?: string | null } | null
    articleMeta?: { publishedTime?: string | null; modifiedTime?: string | null; section?: string | null; tags?: string[] | null; author?: string | null } | null
  } | null
}

/** The post fields the helpers read. Matches the pack's `Post` type and most hand-written ones. */
export interface SeoPostInput {
  title?: string | null
  excerpt?: string | null
  content?: string | null
  slug?: string | null
  uri?: string | null
  date?: string | null
  modified?: string | null
  author?: { node?: { name?: string | null } | null } | null
  featuredImage?: { node?: { sourceUrl?: string | null; altText?: string | null } | null } | null
  categories?: { nodes?: Array<{ name?: string | null; slug?: string | null }> | null } | null
  tags?: { nodes?: Array<{ name?: string | null }> | null } | null
  seo?: RankMathSeo | null
}

export interface SeoSite {
  /** Public site URL, e.g. https://example.com (default NEXT_PUBLIC_SITE_URL). */
  url?: string
  name?: string
  /** WordPress origin to rewrite (default: origin of NEXT_PUBLIC_GRAPHQL_ENDPOINT). */
  wordpressUrl?: string
  /** Path used when a post has no `uri`, e.g. (slug) => `/blog/${slug}`. */
  postPath?: (post: SeoPostInput) => string
}

function trimSlash(url: string): string {
  return url.replace(/\/+$/, '')
}

function originOf(url: string | undefined): string | null {
  if (!url) return null
  try {
    return new URL(url).origin
  } catch {
    return null
  }
}

function siteUrl(site?: SeoSite): string {
  return trimSlash(site?.url || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
}

function wordpressOrigin(site?: SeoSite): string | null {
  return originOf(site?.wordpressUrl || process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT)
}

/**
 * Rewrites a WordPress URL to the Next.js site. Media under /wp-content/ stays on WordPress,
 * because the Next.js app does not serve it.
 */
export function toSiteUrl(url: string | null | undefined, site?: SeoSite): string | undefined {
  if (!url) return undefined
  const wp = wordpressOrigin(site)
  if (!wp || !url.startsWith(wp)) return url
  const rest = url.slice(wp.length)
  if (rest.startsWith('/wp-content/')) return url
  return siteUrl(site) + (rest || '/')
}

/** Rewrites WordPress page URLs inside any string (used for JSON-LD), leaving media URLs alone. */
export function rewriteWordPressUrls(text: string, site?: SeoSite): string {
  const wp = wordpressOrigin(site)
  if (!wp) return text
  const target = siteUrl(site)
  const escaped = wp.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')
  return text.replace(new RegExp(`${escaped}(?!/wp-content/)(?=[/"'?#\\s]|$)`, 'g'), target)
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#8217;/g, '’').replace(/&#8220;|&#8221;/g, '"').replace(/\s+/g, ' ').trim()
}

/** Plain-text excerpt, cut at a word boundary. */
export function plainExcerpt(post: SeoPostInput, maxLength = 155): string {
  const text = stripHtml(post.excerpt || post.content || '')
  if (text.length <= maxLength) return text
  const cut = text.slice(0, maxLength - 1)
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), 0) || cut.length)}…`
}

function postUrl(post: SeoPostInput, site?: SeoSite): string {
  if (post.uri) return siteUrl(site) + (post.uri.startsWith('/') ? post.uri : `/${post.uri}`)
  if (site?.postPath) return siteUrl(site) + site.postPath(post)
  return `${siteUrl(site)}/blog/${post.slug || ''}`
}

function robotsFrom(list: string[] | null | undefined): Metadata['robots'] | undefined {
  if (!list?.length) return undefined
  const set = new Set(list.map((r) => r.toLowerCase()))
  return {
    index: !set.has('noindex'),
    follow: !set.has('nofollow'),
    ...(set.has('noarchive') ? { noarchive: true } : {}),
    ...(set.has('nosnippet') ? { nosnippet: true } : {}),
    ...(set.has('noimageindex') ? { noimageindex: true } : {}),
  }
}

/** Next.js metadata for a post: Rank Math fields first, then the post's own title and excerpt. */
export function rankMathMetadata(post: SeoPostInput, site?: SeoSite): Metadata {
  const seo = post.seo || {}
  const og = seo.openGraph || {}
  const tw = og.twitterMeta || {}
  const fallbackTitle = stripHtml(post.title || '')
  const description = seo.description || plainExcerpt(post)
  const canonical = toSiteUrl(seo.canonicalUrl, site) || postUrl(post, site)
  const image = og.image?.secureUrl || og.image?.url || post.featuredImage?.node?.sourceUrl || undefined
  const ogTitle = og.title || seo.title || fallbackTitle
  const ogDescription = og.description || description
  const keywords = seo.focusKeywords?.filter(Boolean)
  const tags = og.articleMeta?.tags?.length ? og.articleMeta.tags : post.tags?.nodes?.map((t) => t.name || '').filter(Boolean)

  return {
    // Rank Math's title already carries the site name, so it skips the layout's title template.
    title: seo.title ? { absolute: seo.title } : fallbackTitle,
    description,
    keywords: keywords?.length ? keywords : undefined,
    alternates: { canonical },
    robots: robotsFrom(seo.robots),
    openGraph: {
      type: 'article',
      title: ogTitle,
      description: ogDescription,
      url: canonical,
      siteName: og.siteName || site?.name,
      publishedTime: og.articleMeta?.publishedTime || post.date || undefined,
      modifiedTime: og.articleMeta?.modifiedTime || og.updatedTime || post.modified || undefined,
      section: og.articleMeta?.section || post.categories?.nodes?.[0]?.name || undefined,
      tags: tags?.length ? tags : undefined,
      authors: post.author?.node?.name ? [post.author.node.name] : undefined,
      images: image
        ? [{ url: image, width: og.image?.width || undefined, height: og.image?.height || undefined, alt: ogTitle }]
        : undefined,
    },
    twitter: {
      card: tw.card === 'summary_card' ? 'summary' : 'summary_large_image',
      title: tw.title || ogTitle,
      description: tw.description || ogDescription,
      images: tw.image || image ? [tw.image || (image as string)] : undefined,
      site: tw.site || undefined,
      creator: tw.creator || undefined,
    },
  }
}

type JsonLdNode = Record<string, unknown>

/** Parses the <script type="application/ld+json"> blocks Rank Math returns in `jsonLd.raw`. */
export function parseRankMathJsonLd(raw: string | null | undefined, site?: SeoSite): JsonLdNode[] {
  if (!raw) return []
  const blocks: JsonLdNode[] = []
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  const bodies: string[] = []
  for (let m = re.exec(raw); m; m = re.exec(raw)) bodies.push(m[1])
  if (bodies.length === 0 && raw.trim().startsWith('{')) bodies.push(raw)
  for (const body of bodies) {
    try {
      // Rewrite after parsing, so escaped slashes (https:\/\/) in the JSON don't hide URLs.
      blocks.push(rewriteDeep(JSON.parse(body.trim()), site) as JsonLdNode)
    } catch {
      // Malformed block: skip it rather than break the page.
    }
  }
  return blocks
}

function rewriteDeep(value: unknown, site?: SeoSite): unknown {
  if (typeof value === 'string') return rewriteWordPressUrls(value, site)
  if (Array.isArray(value)) return value.map((v) => rewriteDeep(v, site))
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, rewriteDeep(v, site)]))
  }
  return value
}

function graphTypes(blocks: JsonLdNode[]): Set<string> {
  const types = new Set<string>()
  const visit = (node: unknown) => {
    if (!node || typeof node !== 'object') return
    const t = (node as JsonLdNode)['@type']
    for (const v of Array.isArray(t) ? t : [t]) if (typeof v === 'string') types.add(v)
    const graph = (node as JsonLdNode)['@graph']
    if (Array.isArray(graph)) graph.forEach(visit)
  }
  blocks.forEach(visit)
  return types
}

/** BreadcrumbList from Rank Math's breadcrumbs (they follow the primary category). */
export function breadcrumbJsonLd(post: SeoPostInput, site?: SeoSite): JsonLdNode | null {
  const crumbs = (post.seo?.breadcrumbs || []).filter((c) => !c.isHidden && c.text)
  if (crumbs.length === 0) return null
  const last = postUrl(post, site)
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: stripHtml(c.text || ''),
      item: i === crumbs.length - 1 ? last : toSiteUrl(c.url, site),
    })),
  }
}

/**
 * JSON-LD for a post: Rank Math's schema with URLs on the Next.js domain, plus a BreadcrumbList
 * when Rank Math's output has none. Without Rank Math schema, a basic Article is built.
 */
export function rankMathJsonLd(post: SeoPostInput, site?: SeoSite): JsonLdNode[] {
  const blocks = parseRankMathJsonLd(post.seo?.jsonLd?.raw, site)
  const types = graphTypes(blocks)

  if (blocks.length === 0) {
    const image = post.featuredImage?.node?.sourceUrl
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.seo?.title || stripHtml(post.title || ''),
      description: post.seo?.description || plainExcerpt(post),
      mainEntityOfPage: postUrl(post, site),
      datePublished: post.date || undefined,
      dateModified: post.modified || post.date || undefined,
      author: post.author?.node?.name ? { '@type': 'Person', name: post.author.node.name } : undefined,
      image: image || undefined,
      publisher: site?.name ? { '@type': 'Organization', name: site.name } : undefined,
    })
  }

  if (!types.has('BreadcrumbList')) {
    const crumbs = breadcrumbJsonLd(post, site)
    if (crumbs) blocks.push(crumbs)
  }
  return blocks
}

/** Serialises JSON-LD for a <script> tag; `<` is escaped so content cannot close the tag. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

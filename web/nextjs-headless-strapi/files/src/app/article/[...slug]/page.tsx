import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, User, Clock } from 'lucide-react'
import {
  resolvePathSegments,
  getPostsByCategory,
  generatePostMetadata,
  formatPostDate,
  calculateReadingTime,
  buildPostPath,
  type ResolvedPath,
} from '@/lib/posts'
import { SITE_CONFIG } from '@/lib/config'
import type { Post, PostCategory } from '@/lib/graphql'

interface PageProps {
  params: Promise<{ slug: string[] }>
}

/**
 * Generate metadata based on resolved path
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const resolved = await resolvePathSegments(slug)

  if (resolved.type === 'not_found') {
    return {
      title: 'Not Found',
      description: 'The requested page could not be found.',
    }
  }

  if (resolved.type === 'post' && resolved.post) {
    return generatePostMetadata(resolved.post, SITE_CONFIG.name, SITE_CONFIG.url)
  }

  // Category or subcategory
  const category = resolved.subcategory || resolved.category
  if (category) {
    return {
      title: `${category.name} - ${SITE_CONFIG.name}`,
      description: category.description || `Browse articles in ${category.name}`,
    }
  }

  return {
    title: 'Articles',
    description: 'Browse our latest articles',
  }
}

export default async function CatchAllPage({ params }: PageProps) {
  const { slug } = await params
  const resolved = await resolvePathSegments(slug)

  if (resolved.type === 'not_found') {
    notFound()
  }

  if (resolved.type === 'post' && resolved.post) {
    return <PostView post={resolved.post} resolved={resolved} />
  }

  // Category or subcategory listing
  const category = resolved.subcategory || resolved.category
  if (category) {
    return <CategoryView category={category} resolved={resolved} />
  }

  notFound()
}

// ============================================================================
// POST VIEW COMPONENT
// ============================================================================

function PostView({ post, resolved }: { post: Post; resolved: ResolvedPath }) {
  const readingTime = calculateReadingTime(post.content || '')

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Breadcrumbs */}
      <nav className="mb-8 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 flex-wrap">
          <li>
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href="/articles" className="hover:text-foreground">
              Articles
            </Link>
          </li>
          {resolved.categoryPath?.map((segment, index) => {
            const path = '/article/' + resolved.categoryPath!.slice(0, index + 1).join('/')
            const isLast = index === resolved.categoryPath!.length - 1
            const category = index === 0 ? resolved.category : resolved.subcategory
            return (
              <span key={segment} className="flex items-center gap-2">
                <span>/</span>
                <Link href={path} className="hover:text-foreground">
                  {category?.name || segment}
                </Link>
              </span>
            )
          })}
          <li>/</li>
          <li className="text-foreground font-medium line-clamp-1">{post.title}</li>
        </ol>
      </nav>

      {/* Post Header */}
      <header className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">{post.title}</h1>

        {post.excerpt && (
          <p className="text-xl text-muted-foreground mb-6">
            {post.excerpt.replace(/<[^>]*>/g, '')}
          </p>
        )}

        {/* Post Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {post.author?.node?.name && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>By {post.author.node.name}</span>
            </div>
          )}
          {post.date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <time dateTime={post.date}>{formatPostDate(post.date)}</time>
            </div>
          )}
          {readingTime > 0 && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{readingTime} min read</span>
            </div>
          )}
        </div>
      </header>

      {/* Featured Image */}
      {post.featuredImage?.node?.sourceUrl && (
        <div className="mb-8 rounded-lg overflow-hidden">
          <Image
            src={post.featuredImage.node.sourceUrl}
            alt={post.featuredImage.node.altText || post.title}
            width={post.featuredImage.node.mediaDetails?.width || 1200}
            height={post.featuredImage.node.mediaDetails?.height || 675}
            className="w-full h-auto"
            priority
          />
        </div>
      )}

      {/* Post Content */}
      <article
        className="prose prose-lg max-w-none dark:prose-invert
          prose-headings:font-bold prose-headings:text-foreground
          prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl
          prose-p:text-base prose-p:leading-relaxed prose-p:text-foreground
          prose-a:text-primary hover:prose-a:text-primary/80 prose-a:no-underline hover:prose-a:underline
          prose-ul:list-disc prose-ul:pl-6 prose-ul:text-foreground
          prose-ol:list-decimal prose-ol:pl-6 prose-ol:text-foreground
          prose-li:mb-2
          prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground
          prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
          prose-pre:bg-muted prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto
          prose-img:rounded-lg
        "
        dangerouslySetInnerHTML={{ __html: post.content || '' }}
      />

      {/* Categories and Tags */}
      <div className="mt-12 pt-8 border-t">
        {post.categories?.nodes && post.categories.nodes.length > 0 && (
          <div className="mb-4">
            <span className="font-semibold text-foreground mr-2">Categories:</span>
            {post.categories.nodes.map((cat, index) => (
              <Link
                key={cat.id}
                href={`/article/${cat.slug}`}
                className="text-primary hover:text-primary/80 mr-2"
              >
                {cat.name}
                {index < post.categories!.nodes.length - 1 ? ',' : ''}
              </Link>
            ))}
          </div>
        )}
        {post.tags?.nodes && post.tags.nodes.length > 0 && (
          <div>
            <span className="font-semibold text-foreground mr-2">Tags:</span>
            {post.tags.nodes.map((tag, index) => (
              <Link
                key={tag.id}
                href={`/article/tag/${tag.slug}`}
                className="text-primary hover:text-primary/80 mr-2"
              >
                {tag.name}
                {index < post.tags!.nodes.length - 1 ? ',' : ''}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// CATEGORY VIEW COMPONENT
// ============================================================================

async function CategoryView({
  category,
  resolved,
}: {
  category: PostCategory
  resolved: ResolvedPath
}) {
  const postsResponse = await getPostsByCategory(category.slug, { first: 20 })
  const posts = postsResponse.posts.nodes

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="mb-8 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href="/articles" className="hover:text-foreground">
              Articles
            </Link>
          </li>
          {resolved.categoryPath?.map((segment, index) => {
            const path = '/article/' + resolved.categoryPath!.slice(0, index + 1).join('/')
            const isLast = index === resolved.categoryPath!.length - 1
            return (
              <span key={segment} className="flex items-center gap-2">
                <span>/</span>
                {isLast ? (
                  <span className="text-foreground font-medium">{category.name}</span>
                ) : (
                  <Link href={path} className="hover:text-foreground">
                    {resolved.category?.name || segment}
                  </Link>
                )}
              </span>
            )
          })}
        </ol>
      </nav>

      {/* Category Header */}
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">{category.name}</h1>
        {category.description && (
          <p className="text-xl text-muted-foreground">{category.description}</p>
        )}
        <p className="text-sm text-muted-foreground mt-2">
          {posts.length} {posts.length === 1 ? 'article' : 'articles'}
        </p>
      </header>

      {/* Posts Grid */}
      {posts.length > 0 ? (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-12">
          No articles found in this category.
        </p>
      )}
    </div>
  )
}

// ============================================================================
// POST CARD COMPONENT
// ============================================================================

function PostCard({ post }: { post: Post }) {
  const postPath = buildPostPath(post, '/article')

  return (
    <article className="group">
      <Link href={postPath} className="block">
        {post.featuredImage?.node?.sourceUrl && (
          <div className="mb-4 rounded-lg overflow-hidden aspect-video">
            <Image
              src={post.featuredImage.node.sourceUrl}
              alt={post.featuredImage.node.altText || post.title}
              width={400}
              height={225}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          </div>
        )}
        <h2 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="text-muted-foreground line-clamp-2">
            {post.excerpt.replace(/<[^>]*>/g, '')}
          </p>
        )}
        {post.date && (
          <p className="text-sm text-muted-foreground mt-2">
            {formatPostDate(post.date)}
          </p>
        )}
      </Link>
    </article>
  )
}

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, User, Clock } from 'lucide-react'
import { getPostBySlug, generatePostMetadata, formatPostDate, calculateReadingTime, getPrimaryCategory } from '@/lib/posts'
import { SITE_CONFIG } from '@/lib/config'

interface PostPageProps {
  params: Promise<{ slug: string }>
}

/**
 * Generate static params for all published posts (for SSG)
 * Returns empty array by default - sites can override to pre-render specific posts
 */
export async function generateStaticParams() {
  // For now, return empty array (dynamic rendering)
  // Sites can override this to fetch all post slugs and pre-render them
  return []
}

/**
 * Generate metadata for the individual post
 */
export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  
  if (!post) {
    return {
      title: 'Post Not Found',
      description: 'The requested blog post could not be found.',
    }
  }
  
  return generatePostMetadata(post, SITE_CONFIG.name, SITE_CONFIG.url)
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const primaryCategory = post.categories?.nodes?.[0]
  const parentCategory = primaryCategory?.parent?.node
  const readingTime = calculateReadingTime(post.content || '')

  // Build category path
  const categoryPath = parentCategory && primaryCategory
    ? `/blog/${parentCategory.slug}/${primaryCategory.slug}`
    : primaryCategory
    ? `/blog/${primaryCategory.slug}`
    : null

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
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
            <Link href="/blog" className="hover:text-foreground">
              Blog
            </Link>
          </li>
          {parentCategory && (
            <>
              <li>/</li>
              <li>
                <Link href={`/blog/${parentCategory.slug}`} className="hover:text-foreground">
                  {parentCategory.name}
                </Link>
              </li>
            </>
          )}
          {primaryCategory && categoryPath && (
            <>
              <li>/</li>
              <li>
                <Link href={categoryPath} className="hover:text-foreground">
                  {primaryCategory.name}
                </Link>
              </li>
            </>
          )}
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
              <time dateTime={post.date}>
                {formatPostDate(post.date)}
              </time>
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
            {post.categories.nodes.map((cat, index) => {
              const catParent = cat.parent?.node
              const catPath = catParent
                ? `/blog/${catParent.slug}/${cat.slug}`
                : `/blog/${cat.slug}`
              return (
                <Link
                  key={cat.id}
                  href={catPath}
                  className="text-primary hover:text-primary/80 mr-2"
                >
                  {cat.name}{index < post.categories.nodes.length - 1 ? ',' : ''}
                </Link>
              )
            })}
          </div>
        )}
        {post.tags?.nodes && post.tags.nodes.length > 0 && (
          <div>
            <span className="font-semibold text-foreground mr-2">Tags:</span>
            {post.tags.nodes.map((tag, index) => (
              <Link
                key={tag.id}
                href={`/blog/tag/${tag.slug}`}
                className="text-primary hover:text-primary/80 mr-2"
              >
                {tag.name}{index < post.tags.nodes.length - 1 ? ',' : ''}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Clock, Calendar, FileText } from 'lucide-react'
import { getPostBySlug, getPosts, formatPostDate, calculateReadingTime, generateExcerpt, getPrimaryCategory, generatePostMetadata } from '@/lib/posts'
import type { Post } from '@/lib/graphql'

// Enable ISR with 1 hour revalidation
export const revalidate = 3600

// Generate static params for all published articles
export async function generateStaticParams() {
  try {
    const data = await getPosts({ first: 100 })
    return data.posts.nodes.map((post) => ({
      slug: post.slug,
    }))
  } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}

// Generate metadata for each article
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  try {
    const post = await getPostBySlug(slug)
    if (!post) {
      return {
        title: 'Article Not Found',
      }
    }
    return generatePostMetadata(post)
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'Article Not Found',
    }
  }
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  let article: Post | null = null
  try {
    article = await getPostBySlug(slug)
    if (!article) {
      notFound()
    }
  } catch (error) {
    console.error('Error fetching article:', error)
    notFound()
  }

  // Fetch all posts to find related articles
  let allPosts: Post[] = []
  try {
    const data = await getPosts({ first: 100 })
    allPosts = data.posts.nodes
  } catch (error) {
    console.error('Error fetching posts for related articles:', error)
  }

  // Find related articles in the same category
  const primaryCategory = article.categories?.nodes?.[0]
  const parentCategory = primaryCategory?.parent?.node
  const category = primaryCategory ? { name: primaryCategory.name, slug: primaryCategory.slug } : null
  
  const relatedArticles = category
    ? allPosts
        .filter((post) => {
          const postCategory = post.categories?.nodes?.[0]
          return postCategory?.slug === category.slug && post.slug !== article.slug
        })
        .slice(0, 3)
    : []

  const readTime = calculateReadingTime(article.content)

  // Build category path for breadcrumbs
  const categoryPath = parentCategory && primaryCategory
    ? `/article/${parentCategory.slug}/${primaryCategory.slug}`
    : primaryCategory
    ? `/article/${primaryCategory.slug}`
    : null

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      {/* Back Button */}
      <Link href="/articles">
        <Button variant="ghost" className="mb-8">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Articles
        </Button>
      </Link>

      {/* Breadcrumbs */}
      {categoryPath && (
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
            {parentCategory && (
              <>
                <li>/</li>
                <li>
                  <Link href={`/article/${parentCategory.slug}`} className="hover:text-foreground">
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
            <li className="text-foreground font-medium line-clamp-1">{article.title}</li>
          </ol>
        </nav>
      )}

      {/* Article Header */}
      <article>
        <header className="mb-12">
          <div className="flex gap-2 mb-4">
            {category && categoryPath && (
              <Link href={categoryPath}>
                <Badge variant="secondary" className="hover:bg-secondary/80 cursor-pointer">
                  {category.name}
                </Badge>
              </Link>
            )}
          </div>
          <h1 className="text-5xl font-bold mb-4">{article.title}</h1>
          {article.excerpt && (
            <p className="text-xl text-muted-foreground mb-6">
              {generateExcerpt(article.excerpt)}
            </p>
          )}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            {article.date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formatPostDate(article.date)}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{readTime} min read</span>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        {article.featuredImage?.node && (
          <div className="mb-12 -mx-4 md:mx-0">
            <img
              src={article.featuredImage.node.sourceUrl}
              alt={article.featuredImage.node.altText || article.title}
              className="w-full rounded-lg shadow-lg"
            />
          </div>
        )}

        {/* Article Content */}
        <div
          className="prose prose-lg max-w-none dark:prose-invert
            prose-headings:font-bold
            prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
            prose-p:text-lg prose-p:leading-relaxed prose-p:mb-6
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-ul:mb-6 prose-ol:mb-6
            prose-li:mb-2
            prose-strong:font-semibold
            prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded
            prose-pre:bg-muted
            prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </article>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <div className="mt-16 pt-8 border-t">
          <div className="bg-primary/5 rounded-lg p-8">
            <div className="flex items-center gap-2 mb-6">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">Related Articles</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map((relatedArticle) => {
                const relatedPrimaryCategory = relatedArticle.categories?.nodes?.[0]
                const relatedParentCategory = relatedPrimaryCategory?.parent?.node
                const relatedCategoryPath = relatedParentCategory && relatedPrimaryCategory
                  ? `/article/${relatedParentCategory.slug}/${relatedPrimaryCategory.slug}`
                  : relatedPrimaryCategory
                  ? `/article/${relatedPrimaryCategory.slug}`
                  : null
                return (
                  <Link
                    key={relatedArticle.slug}
                    href={`/article/${relatedArticle.slug}`}
                    className="group"
                  >
                    <div className="bg-background border border-border rounded-lg p-6 h-full hover:shadow-md hover:border-primary transition-all">
                      {relatedPrimaryCategory && relatedCategoryPath && (
                        <Link href={relatedCategoryPath} onClick={(e) => e.stopPropagation()}>
                          <Badge variant="secondary" className="mb-3 hover:bg-secondary/80 cursor-pointer">
                            {relatedPrimaryCategory.name}
                          </Badge>
                        </Link>
                      )}
                      <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                        {relatedArticle.title}
                      </h3>
                      {relatedArticle.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {generateExcerpt(relatedArticle.excerpt)}
                        </p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Footer CTA */}
      <div className="mt-16 pt-8 border-t">
        <div className="bg-primary/5 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-3">Want to Read More?</h2>
          <p className="text-muted-foreground mb-6">
            Explore more articles and insights.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/articles">
              <Button size="lg" variant="outline">
                Browse All Articles
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}


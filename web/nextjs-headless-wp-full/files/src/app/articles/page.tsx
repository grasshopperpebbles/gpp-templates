import { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, ArrowRight } from 'lucide-react'
import { getPosts, getCategories, formatPostDate, calculateReadingTime, generateExcerpt, getPrimaryCategory } from '@/lib/posts'
import type { Post } from '@/lib/graphql'

// Enable ISR with 1 hour revalidation
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Articles',
  description: 'Browse our collection of articles and blog posts',
  openGraph: {
    title: 'Articles',
    description: 'Browse our collection of articles and blog posts',
    type: 'website',
  },
}

export default async function ArticlesPage() {
  // Fetch all published posts from WordPress
  let allPosts: Post[] = []
  let categories: any[] = []

  try {
    const [postsData, categoriesData] = await Promise.all([
      getPosts({ first: 100 }),
      getCategories(),
    ])
    allPosts = postsData.posts.nodes
    categories = categoriesData
  } catch (error) {
    console.error('Error fetching WordPress posts:', error)
    // Fallback to empty array if WordPress is unavailable
    allPosts = []
  }

  // Sort posts by date (newest first)
  allPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Get featured post (first post or can be customized)
  const featuredPost = allPosts[0]
  const regularPosts = allPosts.slice(1)

  return (
    <div className="container mx-auto px-4 py-16 max-w-7xl">
      {/* Header */}
      <div className="text-center mb-16">
        <Badge variant="secondary" className="mb-4">
          <BookOpen className="h-3 w-3 mr-1" />
          Articles
        </Badge>
        <h1 className="text-5xl font-bold mb-4">Articles & Blog Posts</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Explore our collection of articles, guides, and insights.
        </p>
      </div>

      {/* Featured Article */}
      {featuredPost && (
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Featured Article</h2>
          <Link href={`/article/${featuredPost.slug}`}>
            <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border-2 border-primary">
              <CardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          {(() => {
                            const primaryCategory = featuredPost.categories?.nodes?.[0]
                            const parentCategory = primaryCategory?.parent?.node
                            const categoryPath = parentCategory && primaryCategory
                              ? `/article/${parentCategory.slug}/${primaryCategory.slug}`
                              : primaryCategory
                              ? `/article/${primaryCategory.slug}`
                              : null
                            return primaryCategory && categoryPath ? (
                              <Link href={categoryPath}>
                                <Badge variant="secondary" className="hover:bg-secondary/80 cursor-pointer">
                                  {primaryCategory.name}
                                </Badge>
                              </Link>
                            ) : null
                          })()}
                          <p className="text-sm text-muted-foreground">
                            {calculateReadingTime(featuredPost.content)} min read
                          </p>
                        </div>
                    <CardTitle className="text-3xl mb-2">{featuredPost.title}</CardTitle>
                    <CardDescription className="text-base">
                      {generateExcerpt(featuredPost.excerpt || featuredPost.content)}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button className="group">
                  Read Complete Article
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* Articles Grid */}
      {regularPosts.length > 0 && (
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">All Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularPosts.map((article) => {
              const primaryCategory = article.categories?.nodes?.[0]
              const parentCategory = primaryCategory?.parent?.node
              const categoryPath = parentCategory && primaryCategory
                ? `/article/${parentCategory.slug}/${primaryCategory.slug}`
                : primaryCategory
                ? `/article/${primaryCategory.slug}`
                : null
              return (
                <Link key={article.slug} href={`/article/${article.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        {primaryCategory && categoryPath && (
                          <Link href={categoryPath} onClick={(e) => e.stopPropagation()}>
                            <Badge variant="outline" className="text-xs hover:bg-secondary/50 cursor-pointer">
                              {primaryCategory.name}
                            </Badge>
                          </Link>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {calculateReadingTime(article.content)} min read
                        </p>
                      </div>
                      <CardTitle className="text-xl">{article.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {generateExcerpt(article.excerpt || article.content)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="ghost" size="sm" className="group p-0 h-auto">
                        Read Article
                        <ArrowRight className="h-3 w-3 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {allPosts.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No articles found.</p>
        </div>
      )}
    </div>
  )
}


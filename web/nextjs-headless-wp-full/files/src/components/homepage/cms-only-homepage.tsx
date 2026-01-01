import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Hero } from './hero'
import {
  ArrowRight,
  BookOpen,
  Newspaper,
  Tag,
  Calendar,
  Users,
  Mail,
} from 'lucide-react'
import type { Post, PostCategory } from '@/lib/graphql'

interface CMSOnlyHomepageProps {
  siteName: string
  siteTagline: string
  recentPosts: Post[]
  postCategories?: PostCategory[]
}

export function CMSOnlyHomepage({
  siteName,
  siteTagline,
  recentPosts,
  postCategories = [],
}: CMSOnlyHomepageProps) {
  // Get featured post (first post)
  const featuredPost = recentPosts[0]
  const secondaryPosts = recentPosts.slice(1, 3)
  const otherPosts = recentPosts.slice(3, 9)

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <Hero
        title={siteName}
        subtitle={siteTagline}
        description="Discover stories, insights, and ideas that matter"
        primaryCta={{ text: 'Start Reading', href: '/blog' }}
        secondaryCta={{ text: 'Browse Topics', href: '/blog/categories' }}
      />

      {/* Featured Article - Large */}
      {featuredPost && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <Link
              href={`/blog/${featuredPost.slug}`}
              className="group grid md:grid-cols-2 gap-8 items-center"
            >
              {featuredPost.featuredImage?.node?.sourceUrl && (
                <div className="aspect-video overflow-hidden rounded-lg">
                  <img
                    src={featuredPost.featuredImage.node.sourceUrl}
                    alt={featuredPost.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                    Featured
                  </span>
                  {featuredPost.categories?.nodes?.[0] && (
                    <span>{featuredPost.categories.nodes[0].name}</span>
                  )}
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4 group-hover:text-primary transition-colors">
                  {featuredPost.title}
                </h2>
                {featuredPost.excerpt && (
                  <p
                    className="text-lg text-muted-foreground mb-6"
                    dangerouslySetInnerHTML={{ __html: featuredPost.excerpt }}
                  />
                )}
                <Button>
                  Read Article
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* Secondary Featured Articles */}
      {secondaryPosts.length > 0 && (
        <section className="py-12 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8">
              {secondaryPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group flex gap-6 items-start"
                >
                  {post.featuredImage?.node?.sourceUrl && (
                    <div className="w-48 flex-shrink-0 aspect-video overflow-hidden rounded-lg">
                      <img
                        src={post.featuredImage.node.sourceUrl}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    {post.categories?.nodes?.[0] && (
                      <span className="text-xs font-medium text-primary mb-2 block">
                        {post.categories.nodes[0].name}
                      </span>
                    )}
                    <h3 className="font-semibold text-xl mb-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p
                        className="text-muted-foreground text-sm line-clamp-2"
                        dangerouslySetInnerHTML={{ __html: post.excerpt }}
                      />
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Site Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Quality Content</h3>
              <p className="text-muted-foreground text-sm">
                Thoughtful, well-researched articles
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Newspaper className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Regular Updates</h3>
              <p className="text-muted-foreground text-sm">Fresh content every week</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Community</h3>
              <p className="text-muted-foreground text-sm">Join the conversation</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Newsletter</h3>
              <p className="text-muted-foreground text-sm">Updates in your inbox</p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Articles Grid */}
      {otherPosts.length > 0 && (
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Latest Articles</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Explore our most recent content
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {otherPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group bg-card rounded-lg overflow-hidden border hover:shadow-lg transition-shadow"
                >
                  {post.featuredImage?.node?.sourceUrl && (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={post.featuredImage.node.sourceUrl}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    {post.categories?.nodes?.[0] && (
                      <span className="text-xs font-medium text-primary mb-2 block">
                        {post.categories.nodes[0].name}
                      </span>
                    )}
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p
                        className="text-muted-foreground text-sm line-clamp-2"
                        dangerouslySetInnerHTML={{ __html: post.excerpt }}
                      />
                    )}
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-8">
              <Button asChild>
                <Link href="/blog">
                  View All Articles
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      {postCategories.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Browse by Topic</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Find content that interests you
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {postCategories.slice(0, 8).map((category) => {
                const catParent = category.parent?.node
                const catPath = catParent
                  ? `/blog/${catParent.slug}/${category.slug}`
                  : `/blog/${category.slug}`
                return (
                  <Link
                    key={category.id}
                    href={catPath}
                    className="group p-6 rounded-lg border bg-card hover:bg-primary/5 transition-colors text-center"
                  >
                    <Tag className="h-8 w-8 text-primary mx-auto mb-3" />
                    <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{category.count} articles</p>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Newsletter CTA */}
      <section className="py-16 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <div className="container mx-auto px-4 text-center">
          <Calendar className="h-12 w-12 text-primary mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Stay in the Loop</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Get notified when we publish new articles. No spam, just great content.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <Button asChild size="lg" className="text-lg">
              <Link href="/blog">
                Explore All Articles
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

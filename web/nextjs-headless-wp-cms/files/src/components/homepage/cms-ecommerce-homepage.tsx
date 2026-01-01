import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ProductCard } from '@/components/product-card'
import { Hero } from './hero'
import {
  ArrowRight,
  BookOpen,
  Newspaper,
  Tag,
  Calendar,
} from 'lucide-react'
import type { Product, ProductCategory, Post, PostCategory } from '@/lib/graphql'

interface CMSEcommerceHomepageProps {
  siteName: string
  siteTagline: string
  recentPosts: Post[]
  featuredProducts?: Product[]
  postCategories?: PostCategory[]
  productCategories?: ProductCategory[]
}

export function CMSEcommerceHomepage({
  siteName,
  siteTagline,
  recentPosts,
  featuredProducts = [],
  postCategories = [],
  productCategories = [],
}: CMSEcommerceHomepageProps) {
  // Get featured post (first post)
  const featuredPost = recentPosts[0]
  const otherPosts = recentPosts.slice(1, 7)

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section - Content focused */}
      <Hero
        title={siteName}
        subtitle={siteTagline}
        description="Stories, insights, and ideas that inspire"
        primaryCta={{ text: 'Read Latest', href: '/blog' }}
        secondaryCta={{ text: 'Visit Shop', href: '/products' }}
      />

      {/* Featured Article */}
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
                  <Calendar className="h-4 w-4" />
                  <span>Featured Article</span>
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

      {/* Content Stats */}
      <section className="py-12 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">In-Depth Articles</h3>
              <p className="text-muted-foreground text-sm">Quality content, not clickbait</p>
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
                <Tag className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Multiple Topics</h3>
              <p className="text-muted-foreground text-sm">Something for everyone</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Archive Access</h3>
              <p className="text-muted-foreground text-sm">Browse our full collection</p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Articles Grid */}
      {otherPosts.length > 0 && (
        <section className="py-16">
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
        <section className="py-16 bg-muted/50">
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

      {/* Shop Section */}
      {featuredProducts.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Shop Our Products</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Curated products we love
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {featuredProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="text-center mt-8">
              <Button asChild variant="outline">
                <Link href="/products">
                  Visit Our Shop
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Newsletter CTA */}
      <section className="py-16 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Stay Updated</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Get notified when we publish new articles
          </p>
          <Button asChild size="lg" className="text-lg">
            <Link href="/blog">
              Explore Our Blog
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

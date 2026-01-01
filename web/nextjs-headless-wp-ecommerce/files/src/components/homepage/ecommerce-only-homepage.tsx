import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ProductCard } from '@/components/product-card'
import { Hero } from './hero'
import {
  ArrowRight,
  ShoppingBag,
  Truck,
  Shield,
  HeadphonesIcon,
  Star,
  Percent,
} from 'lucide-react'
import type { Product, ProductCategory } from '@/lib/graphql'

interface EcommerceOnlyHomepageProps {
  siteName: string
  siteTagline: string
  featuredProducts: Product[]
  popularProducts: Product[]
  categories: ProductCategory[]
  onSaleProducts?: Product[]
}

export function EcommerceOnlyHomepage({
  siteName,
  siteTagline,
  featuredProducts,
  popularProducts,
  categories,
  onSaleProducts = [],
}: EcommerceOnlyHomepageProps) {
  const featuredCategories = categories.filter((cat) => !cat.parent).slice(0, 8)
  const topCategories = categories.filter((cat) => !cat.parent).slice(0, 4)

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section - Product focused */}
      <Hero
        title={siteName}
        subtitle={siteTagline}
        description="Browse our collection and find exactly what you need"
        primaryCta={{ text: 'Shop All Products', href: '/products' }}
        secondaryCta={{ text: 'View Categories', href: '/products/categories' }}
      />

      {/* Trust Badges */}
      <section className="py-12 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Free Shipping</h3>
              <p className="text-muted-foreground text-sm">On orders over $50</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Secure Payment</h3>
              <p className="text-muted-foreground text-sm">100% secure checkout</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Quality Products</h3>
              <p className="text-muted-foreground text-sm">Handpicked selection</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <HeadphonesIcon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">24/7 Support</h3>
              <p className="text-muted-foreground text-sm">We&apos;re here to help</p>
            </div>
          </div>
        </div>
      </section>

      {/* Top Categories with Images */}
      {topCategories.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Shop by Category</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Find what you&apos;re looking for
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {topCategories.map((category) => (
                <Link
                  key={category.id}
                  href={`/products?category=${category.slug}`}
                  className="group relative aspect-square rounded-xl overflow-hidden bg-muted"
                >
                  {category.image?.sourceUrl && (
                    <img
                      src={category.image.sourceUrl}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/0 flex items-end p-6">
                    <div>
                      <h3 className="font-semibold text-xl text-white mb-1">
                        {category.name}
                      </h3>
                      <p className="text-white/80 text-sm">{category.count} products</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Best Sellers */}
      {popularProducts.length > 0 && (
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-12">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-5 w-5 text-primary" />
                  <span className="text-primary font-medium">Top Rated</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">Best Sellers</h2>
              </div>
              <Button asChild variant="outline">
                <Link href="/products?sort=popularity">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {popularProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* On Sale Products */}
      {onSaleProducts.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-12">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Percent className="h-5 w-5 text-red-500" />
                  <span className="text-red-500 font-medium">Limited Time</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">On Sale</h2>
              </div>
              <Button asChild variant="outline">
                <Link href="/products?on_sale=true">
                  View All Deals
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {onSaleProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products / New Arrivals */}
      {featuredProducts.length > 0 && (
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-12">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  <span className="text-primary font-medium">Just Arrived</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">New Products</h2>
              </div>
              <Button asChild variant="outline">
                <Link href="/products?sort=date">
                  View All New
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Categories Grid */}
      {featuredCategories.length > 4 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">All Categories</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Browse our complete collection
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {featuredCategories.map((category) => (
                <Link
                  key={category.id}
                  href={`/products?category=${category.slug}`}
                  className="group p-6 rounded-lg border bg-card hover:bg-muted/50 transition-colors text-center"
                >
                  <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{category.count} products</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <div className="container mx-auto px-4 text-center">
          <ShoppingBag className="h-12 w-12 text-primary mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Shop?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Explore our full collection and find exactly what you need
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg">
              <Link href="/products">
                Browse All Products
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg">
              <Link href="/products/categories">View All Categories</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

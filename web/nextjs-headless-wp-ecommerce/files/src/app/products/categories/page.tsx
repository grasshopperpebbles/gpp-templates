import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  graphqlClient,
  GET_PRODUCT_CATEGORIES,
  type CategoriesResponse,
} from '@/lib/graphql'
import { ChevronRight, ArrowRight } from 'lucide-react'

export const revalidate = 300 // ISR: revalidate every 5 minutes (categories change less often)

export default async function CategoriesPage() {
  // Fetch categories on server with ISR caching
  const data = await graphqlClient.query<CategoriesResponse>(
    GET_PRODUCT_CATEGORIES,
    {},
    { next: { revalidate: 300, tags: ['categories'] } }
  )

  const categories = data.productCategories.nodes

  // Get only parent categories (those without a parent)
  const parentCategories = categories.filter((cat) => !cat.parent)

  // Get children for a specific parent
  const getChildren = (parentSlug: string) => {
    return categories.filter((cat) => cat.parent?.node?.slug === parentSlug)
  }

  // Category icons mapping
  const categoryIcons: Record<string, string> = {
    science: '🧪',
    tech: '💻',
    language: '🗣️',
    'pop-culture': '🎮',
  }

  // Category descriptions
  const categoryDescriptions: Record<string, string> = {
    science: 'Express yourself with scientific precision and educational flair',
    tech: 'Digital codes and modern technology for the tech-savvy',
    language: 'Creative wordplay and linguistic transformations',
    'pop-culture': 'Gaming, sci-fi, and retro pop culture references',
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Browse Categories</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Explore all the creative ways to express yourself
        </p>
      </div>

      {/* Parent Categories */}
      <div className="space-y-12">
        {parentCategories.map((parentCat) => {
          const children = getChildren(parentCat.slug)

          return (
            <div key={parentCat.id} className="space-y-6">
              {/* Parent Category Header */}
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-4">
                  <span className="text-5xl">{categoryIcons[parentCat.slug] || '✨'}</span>
                  <div>
                    <h2 className="text-2xl font-bold">{parentCat.name}</h2>
                    <p className="text-muted-foreground">
                      {categoryDescriptions[parentCat.slug] ||
                        parentCat.description ||
                        'Explore this category'}
                    </p>
                  </div>
                </div>
                <Button asChild variant="outline">
                  <Link href={`/products?category=${parentCat.slug}`}>
                    View All ({parentCat.count})
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              {/* Child Categories Grid */}
              {children.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {children.map((childCat) => (
                    <Link
                      key={childCat.id}
                      href={`/products?category=${childCat.slug}`}
                      className="group relative overflow-hidden rounded-lg border bg-card hover:shadow-lg transition-all"
                    >
                      <div className="p-6">
                        {childCat.image?.sourceUrl && (
                          <div className="relative aspect-video mb-4 overflow-hidden rounded-md">
                            <Image
                              src={childCat.image.sourceUrl}
                              alt={childCat.image.altText || childCat.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform"
                              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            />
                          </div>
                        )}

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                              {childCat.name}
                            </h3>
                            <Badge variant="secondary">{childCat.count}</Badge>
                          </div>

                          {childCat.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {childCat.description}
                            </p>
                          )}

                          <div className="flex items-center text-sm text-primary font-medium pt-2">
                            Browse <ChevronRight className="h-4 w-4 ml-1" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* View All Products CTA */}
      <div className="mt-16 text-center p-12 bg-muted/50 rounded-lg">
        <h3 className="text-2xl font-bold mb-4">Can&apos;t find what you&apos;re looking for?</h3>
        <p className="text-muted-foreground mb-6">
          Browse all products to see our complete collection
        </p>
        <Button asChild size="lg">
          <Link href="/products">
            View All Products
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

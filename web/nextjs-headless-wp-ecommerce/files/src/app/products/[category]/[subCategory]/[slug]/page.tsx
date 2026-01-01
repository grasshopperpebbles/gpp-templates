import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ChevronRight,
  ShoppingCart,
  Check,
  Truck,
  Shield,
  RefreshCw,
} from 'lucide-react'
import { graphqlClient, type Product } from '@/lib/graphql'
import { formatPrice } from '@/lib/utils'
import { ProductDetailClient } from './ProductDetailClient'
import { ReviewsSection } from '@/components/reviews-section'
import { StarRating } from '@/components/ui/star-rating'

// Updated query to include reviews and ratings
const GET_PRODUCT_BY_SLUG = `
  query GetProductBySlug($slug: ID!) {
    product(id: $slug, idType: SLUG) {
      id
      databaseId
      name
      slug
      description
      shortDescription
      reviewCount
      averageRating
      ... on SimpleProduct {
        sku
        weight
        length
        width
        height
        price
        regularPrice
        salePrice
        onSale
        stockStatus
        stockQuantity
        attributes {
          nodes {
            id
            name
            options
            ... on GlobalProductAttribute {
              slug
            }
          }
        }
        galleryImages {
          nodes {
            id
            sourceUrl
            altText
          }
        }
      }
      image {
        sourceUrl
        altText
      }
      productCategories {
        nodes {
          id
          name
          slug
          parent {
            node {
              id
              name
              slug
            }
          }
        }
      }
      reviews {
        edges {
          rating
          node {
            id
            databaseId
            content
            date
            author {
              node {
                name
              }
            }
          }
        }
      }
      related(first: 4) {
        nodes {
          id
          databaseId
          name
          slug
          onSale
          image {
            sourceUrl
            altText
          }
          ... on SimpleProduct {
            price
            regularPrice
            salePrice
          }
        }
      }
    }
  }
`

interface ProductResponse {
  product: Product
}

interface ProductPageProps {
  params: {
    category: string
    subCategory: string
    slug: string
  }
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug, category, subCategory } = params

  // Server-side data fetching with Next.js caching
  const data = await graphqlClient.query<ProductResponse>(
    GET_PRODUCT_BY_SLUG,
    { slug },
    {
      next: {
        revalidate: 60, // Cache for 60 seconds (ISR)
        tags: [`product-${slug}`], // Tag for on-demand revalidation
      },
    }
  )

  if (!data.product) {
    notFound()
  }

  const product = data.product

  // Get primary category
  const primaryCategory = product.productCategories?.nodes?.[0]
  const parentCategory = primaryCategory?.parent?.node

  // Build breadcrumbs
  const breadcrumbs = [
    { name: 'Products', href: '/products' },
    {
      name: parentCategory?.name || category,
      href: `/products/${parentCategory?.slug || category}`,
    },
    {
      name: primaryCategory?.name || subCategory,
      href: `/products/${parentCategory?.slug || category}/${primaryCategory?.slug || subCategory}`,
    },
    { name: product.name, href: '#' },
  ]

  // Get gallery images
  const galleryImages = product.galleryImages?.nodes || []
  const mainImage = product.image?.sourceUrl || '/placeholder-product.jpg'
  const allImages = [
    { id: 'main', sourceUrl: mainImage, altText: product.image?.altText || product.name },
    ...galleryImages.map(img => ({
      ...img,
      altText: img.altText || product.name
    })),
  ]

  // Stock info
  const isInStock = product.stockStatus === 'IN_STOCK'
  const stockQuantity = product.stockQuantity || 0
  const showLowStockWarning = isInStock && stockQuantity > 0 && stockQuantity <= 10

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.href} className="flex items-center">
            {index > 0 && <ChevronRight className="h-4 w-4 mx-2" />}
            {index < breadcrumbs.length - 1 ? (
              <Link href={crumb.href} className="hover:text-gray-900">
                {crumb.name}
              </Link>
            ) : (
              <span className="text-gray-900 font-medium">{crumb.name}</span>
            )}
          </div>
        ))}
      </nav>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Interactive client component for gallery, cart, etc */}
        <ProductDetailClient
          product={product}
          allImages={allImages}
          isInStock={isInStock}
          stockQuantity={stockQuantity}
          showLowStockWarning={showLowStockWarning}
        />

        {/* Product Info - Server rendered */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>

            {/* Rating */}
            {product.averageRating && product.averageRating > 0 && (
              <div className="mb-4">
                <StarRating 
                  rating={product.averageRating} 
                  size="md" 
                  showValue={true}
                  showCount={true}
                  count={product.reviewCount}
                />
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-4">
              {product.onSale && product.salePrice ? (
                <>
                  <span className="text-3xl font-bold text-red-600">
                    {formatPrice(product.salePrice)}
                  </span>
                  <span className="text-xl text-gray-500 line-through">
                    {formatPrice(product.regularPrice || '')}
                  </span>
                  <Badge variant="destructive">SALE</Badge>
                </>
              ) : (
                <span className="text-3xl font-bold">
                  {formatPrice(product.price || product.regularPrice || '')}
                </span>
              )}
            </div>

            {/* Stock Status */}
            {isInStock ? (
              <div className="flex items-center gap-2 text-green-600 mb-4">
                <Check className="h-5 w-5" />
                <span className="font-medium">In Stock</span>
              </div>
            ) : (
              <div className="text-red-600 font-medium mb-4">Out of Stock</div>
            )}

            {/* Low Stock Warning */}
            {showLowStockWarning && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-amber-800">
                  ⚠️ Only {stockQuantity} left in stock!
                </p>
              </div>
            )}
          </div>

          {/* Short Description */}
          {product.shortDescription && (
            <div
              className="text-gray-700 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: product.shortDescription }}
            />
          )}

          <Separator />

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 py-4">
            <div className="flex flex-col items-center text-center space-y-2">
              <Truck className="h-8 w-8 text-blue-600" />
              <span className="text-sm font-medium">Free Shipping</span>
              <span className="text-xs text-gray-500">On orders over $50</span>
            </div>
            <div className="flex flex-col items-center text-center space-y-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="text-sm font-medium">Secure Payment</span>
              <span className="text-xs text-gray-500">100% protected</span>
            </div>
            <div className="flex flex-col items-center text-center space-y-2">
              <RefreshCw className="h-8 w-8 text-blue-600" />
              <span className="text-sm font-medium">30-Day Returns</span>
              <span className="text-xs text-gray-500">Easy returns</span>
            </div>
          </div>

          <Separator />

          {/* Tabs - Description & Specs */}
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="specs">Specifications</TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="mt-4">
              {product.description ? (
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              ) : (
                <p className="text-gray-500">No description available.</p>
              )}
            </TabsContent>
            <TabsContent value="specs" className="mt-4">
              <dl className="space-y-3">
                {product.sku && (
                  <>
                    <div className="flex justify-between py-2 border-b">
                      <dt className="font-medium text-gray-700">SKU:</dt>
                      <dd className="text-gray-900">{product.sku}</dd>
                    </div>
                  </>
                )}
                {product.weight && (
                  <div className="flex justify-between py-2 border-b">
                    <dt className="font-medium text-gray-700">Weight:</dt>
                    <dd className="text-gray-900">{product.weight} lbs</dd>
                  </div>
                )}
                {(product.length || product.width || product.height) && (
                  <div className="flex justify-between py-2 border-b">
                    <dt className="font-medium text-gray-700">Dimensions:</dt>
                    <dd className="text-gray-900">
                      {product.length || '0'} × {product.width || '0'} ×{' '}
                      {product.height || '0'} in
                    </dd>
                  </div>
                )}
              </dl>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-16">
        <ReviewsSection
          reviews={product.reviews?.edges.map(edge => ({ ...edge.node, rating: edge.rating })) || []}
          averageRating={product.averageRating || 0}
          reviewCount={product.reviewCount || 0}
          productId={product.databaseId}
          productName={product.name}
        />
      </div>

      {/* Related Products */}
      {product.related?.nodes && product.related.nodes.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {product.related.nodes.map((relatedProduct) => {
              const relatedPrice = relatedProduct.price || relatedProduct.regularPrice
              const relatedSalePrice = relatedProduct.onSale
                ? relatedProduct.salePrice
                : null

              return (
                <Link
                  key={relatedProduct.id}
                  href={`/products/${category}/${subCategory}/${relatedProduct.slug}`}
                  className="group"
                >
                  <div className="relative aspect-square mb-3 overflow-hidden rounded-lg bg-gray-100">
                    {relatedProduct.image?.sourceUrl && (
                      <Image
                        src={relatedProduct.image.sourceUrl}
                        alt={relatedProduct.image.altText || relatedProduct.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    )}
                    {relatedProduct.onSale && (
                      <Badge
                        variant="destructive"
                        className="absolute top-2 right-2"
                      >
                        SALE
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2 group-hover:text-blue-600">
                    {relatedProduct.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    {relatedSalePrice ? (
                      <>
                        <span className="font-bold text-red-600">
                          {formatPrice(relatedSalePrice)}
                        </span>
                        <span className="text-sm text-gray-500 line-through">
                          {formatPrice(relatedPrice || '')}
                        </span>
                      </>
                    ) : (
                      <span className="font-bold">
                        {formatPrice(relatedPrice || '')}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

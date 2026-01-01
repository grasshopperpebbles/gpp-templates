'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { ShoppingCart, Atom, Binary, Languages, Sparkles, type LucideIcon } from 'lucide-react'
import { Product } from '@/lib/graphql'
import { useCart } from '@/store/cart'
import { formatPrice } from '@/lib/utils'
import { StarRating } from '@/components/ui/star-rating'
import { WishlistButton } from '@/components/wishlist-button'

// Map parent category slugs to icons
const parentCategoryIcons: Record<string, LucideIcon> = {
  'science': Atom,
  'tech': Binary,
  'language': Languages,
  'pop-culture': Sparkles,
}

interface ProductCardProps {
  product: Product
  className?: string
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { addToCart, isProductLoading } = useCart()

  const isLoading = isProductLoading(product.databaseId)

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation when clicking the button

    await addToCart({
      id: product.databaseId,
      name: product.name,
      slug: product.slug,
      price: product.price || '0',
      image: product.image?.sourceUrl,
    })
  }

  const displayPrice = product.onSale ? product.salePrice : (product.regularPrice || product.price)
  const originalPrice = product.onSale ? product.regularPrice : null

  // Build SEO-friendly product URL with category hierarchy
  const getProductUrl = () => {
    const primaryCategory = product.productCategories?.nodes[0]
    const parentCategory = primaryCategory?.parent?.node

    if (parentCategory && primaryCategory) {
      return `/products/${parentCategory.slug}/${primaryCategory.slug}/${product.slug}`
    } else if (primaryCategory) {
      // Fallback if no parent category
      return `/products/${primaryCategory.slug}/${product.slug}`
    }
    // Fallback to simple slug
    return `/products/${product.slug}`
  }

  const productUrl = getProductUrl()

  // Get parent category icon
  const primaryCategory = product.productCategories?.nodes[0]
  const parentCategory = primaryCategory?.parent?.node
  const ParentIcon = parentCategory ? parentCategoryIcons[parentCategory.slug] : null

  return (
    <Card className={`group h-full flex flex-col transition-all duration-200 hover:shadow-lg ${className}`}>
      <Link href={productUrl}>
        <div className="relative aspect-square overflow-hidden rounded-t-lg">
          {product.image?.sourceUrl ? (
            <Image
              src={product.image.sourceUrl}
              alt={product.image.altText || product.name}
              fill
              className="object-cover transition-transform duration-200 group-hover:scale-105"
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-100">
              <span className="text-gray-400">No image</span>
            </div>
          )}

          {/* Parent Category Icon */}
          {ParentIcon && (
            <div className="absolute left-2 top-2 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center">
              <ParentIcon className="h-4 w-4 text-primary" />
            </div>
          )}

          {product.onSale && (
            <Badge
              variant="destructive"
              className="absolute left-2 top-12 z-10"
            >
              Sale
            </Badge>
          )}

          {product.stockStatus !== 'IN_STOCK' && (
            <Badge
              variant="secondary"
              className="absolute right-2 top-2 z-10"
            >
              Out of Stock
            </Badge>
          )}

          {/* Wishlist Button */}
          <div className="absolute right-2 bottom-2 z-10 bg-white rounded-full shadow-md">
            <WishlistButton
              productId={product.databaseId.toString()}
              productName={product.name}
              productPrice={product.price || '0'}
              productSalePrice={product.salePrice}
              productImage={product.image?.sourceUrl}
              productSlug={product.slug}
              productCategory={parentCategory?.slug || primaryCategory?.slug || ''}
              productSubCategory={primaryCategory?.slug || ''}
              onSale={product.onSale || false}
              variant="icon"
            />
          </div>
        </div>
      </Link>

      <CardContent className="p-4 flex-1">
        <div className="space-y-2">
          {product.productCategories?.nodes && product.productCategories.nodes.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {product.productCategories.nodes.slice(0, 2).map((category) => (
                <Link
                  key={category.id}
                  href={`/products/categories/${category.slug}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Badge variant="outline" className="text-xs hover:bg-muted cursor-pointer">
                    {category.name}
                  </Badge>
                </Link>
              ))}
            </div>
          )}


          <Link href={productUrl}>
            <h3 className="font-semibold text-lg leading-tight line-clamp-2 hover:text-primary transition-colors">
              {product.name}
            </h3>
          </Link>
          
          {/* Rating */}
          {product.averageRating && product.averageRating > 0 && (
            <StarRating 
              rating={product.averageRating} 
              size="sm" 
              showValue={false}
              showCount={true}
              count={product.reviewCount}
            />
          )}
          
          {product.shortDescription && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {product.shortDescription.replace(/<[^>]*>/g, '').trim()}
            </p>
          )}
        </div>
      </CardContent>

      <div className="mt-auto">
        <CardContent className="p-4 pt-0">
          <div className="flex items-center gap-2">
            {displayPrice && (
              <span className="font-bold text-lg">
                {formatPrice(displayPrice)}
              </span>
            )}
            {originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <Button
            onClick={handleAddToCart}
            disabled={product.stockStatus !== 'IN_STOCK' || isLoading}
            className="w-full"
            variant={product.stockStatus !== 'IN_STOCK' ? 'secondary' : 'default'}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {product.stockStatus !== 'IN_STOCK' ? 'Out of Stock' : 'Add to Cart'}
          </Button>
        </CardFooter>
      </div>
    </Card>
  )
}

export function ProductCardSkeleton() {
  return (
    <Card className="h-full">
      <div className="aspect-square animate-pulse bg-gray-200 rounded-t-lg" />
      <CardContent className="p-4 space-y-2">
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
        <div className="h-6 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        <div className="h-6 bg-gray-200 rounded animate-pulse w-1/2" />
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <div className="h-10 bg-gray-200 rounded animate-pulse w-full" />
      </CardFooter>
    </Card>
  )
}
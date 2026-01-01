'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProductCard, ProductCardSkeleton } from '@/components/product-card'
import {
  graphqlClient,
  GET_PRODUCTS,
  type ProductsResponse,
  type Product,
} from '@/lib/graphql'
import { ChevronLeft, ChevronRight, Tag } from 'lucide-react'

export default function SalePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [hasPreviousPage, setHasPreviousPage] = useState(false)
  const [endCursor, setEndCursor] = useState<string | null>(null)

  const PRODUCTS_PER_PAGE = 12

  // Fetch products and filter for sale items
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const data = await graphqlClient.query<ProductsResponse>(GET_PRODUCTS, {
          first: 100, // Fetch more to ensure we have enough sale items
          after: currentPage > 1 ? endCursor : null,
        })

        // Filter for products on sale
        const saleProducts = data.products.nodes.filter(product => product.onSale)

        setProducts(saleProducts)
        setHasNextPage(data.products.pageInfo.hasNextPage)
        setHasPreviousPage(data.products.pageInfo.hasPreviousPage)
        setEndCursor(data.products.pageInfo.endCursor || null)

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load products')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [currentPage])

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">Error</h2>
          <p className="text-muted-foreground mt-2">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/products" className="hover:text-foreground">
            Products
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">Sale</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Tag className="h-8 w-8 text-primary" />
              <h1 className="text-3xl md:text-4xl font-bold">
                Sale Products
              </h1>
            </div>
            <p className="text-muted-foreground mt-2">
              {isLoading ? 'Loading...' : `${products.length} products on sale`}
            </p>
          </div>

          <Badge variant="destructive" className="text-base px-4 py-2 w-fit">
            Save on these amazing designs!
          </Badge>
        </div>
      </div>

      {/* Products grid */}
      <div className="flex-1">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: PRODUCTS_PER_PAGE }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No sale items found</h3>
            <p className="text-muted-foreground mb-4">
              Check back soon for great deals on our products
            </p>
            <Button asChild>
              <Link href="/products">
                Browse All Products
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {(hasNextPage || hasPreviousPage) && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <Button
                  onClick={() => setCurrentPage(p => p - 1)}
                  disabled={!hasPreviousPage || currentPage === 1}
                  variant="outline"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                <span className="text-sm text-muted-foreground px-4">
                  Page {currentPage}
                </span>

                <Button
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={!hasNextPage}
                  variant="outline"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

import { Suspense } from 'react'
import Link from 'next/link'
import { ProductCard, ProductCardSkeleton } from '@/components/product-card'
import {
  graphqlClient,
  GET_PRODUCTS,
  GET_PRODUCT_CATEGORIES,
  type ProductsResponse,
  type CategoriesResponse,
} from '@/lib/graphql'
import { ProductsFilter } from './ProductsFilter'

export const revalidate = 60 // ISR: revalidate every 60 seconds

interface ProductsPageProps {
  searchParams: {
    category?: string
    sort?: string
    search?: string
    page?: string
  }
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  // Fetch data on server with caching
  const [productsData, categoriesData] = await Promise.all([
    graphqlClient.query<ProductsResponse>(
      GET_PRODUCTS,
      { first: 100 }, // Fetch all products for client-side filtering
      { next: { revalidate: 60, tags: ['products'] } }
    ),
    graphqlClient.query<CategoriesResponse>(
      GET_PRODUCT_CATEGORIES,
      {},
      { next: { revalidate: 300, tags: ['categories'] } } // Categories change less often
    ),
  ])

  const allProducts = productsData.products.nodes
  const categories = categoriesData.productCategories.nodes

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">All Products</h1>
        <p className="text-muted-foreground">
          Express yourself in {allProducts.length}+ creative ways
        </p>
      </div>

      {/* Client component for filtering/sorting */}
      <ProductsFilter
        initialProducts={allProducts}
        categories={categories}
        initialCategory={searchParams.category}
        initialSort={searchParams.sort}
        initialSearch={searchParams.search}
      />
    </div>
  )
}

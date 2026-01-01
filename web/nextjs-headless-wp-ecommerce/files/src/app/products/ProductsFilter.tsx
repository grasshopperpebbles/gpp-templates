'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ProductCard } from '@/components/product-card'
import type { Product, ProductCategory } from '@/lib/graphql'
import {
  Search,
  X,
  SlidersHorizontal,
  Plus,
  Minus,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc'

interface ProductsFilterProps {
  initialProducts: Product[]
  categories: ProductCategory[]
  initialCategory?: string
  initialSort?: string
  initialSearch?: string
}

export function ProductsFilter({
  initialProducts,
  categories,
  initialCategory,
  initialSort,
  initialSearch,
}: ProductsFilterProps) {
  // Note: router and searchParams could be used for URL state management if needed

  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    initialCategory || null
  )
  const [searchQuery, setSearchQuery] = useState(initialSearch || '')
  const [sortBy, setSortBy] = useState<SortOption>((initialSort as SortOption) || 'default')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // Get parent categories
  const parentCategories = useMemo(
    () => categories.filter((cat) => !cat.parent),
    [categories]
  )

  // Calculate product counts for each category
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>()

    // Count products for each category
    categories.forEach((category) => {
      const count = initialProducts.filter((product) =>
        product.productCategories?.nodes.some((cat) => cat.slug === category.slug)
      ).length

      counts.set(category.slug, count)
    })

    // For parent categories, add up counts from children
    categories.forEach((category) => {
      if (!category.parent) {
        const children = categories.filter(
          (c) => c.parent?.node.slug === category.slug
        )
        const childCount = children.reduce(
          (sum, child) => sum + (counts.get(child.slug) || 0),
          0
        )
        // Use the greater of direct count or children sum
        const directCount = counts.get(category.slug) || 0
        counts.set(category.slug, Math.max(directCount, childCount))
      }
    })

    return counts
  }, [categories, initialProducts])

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...initialProducts]

    // Filter by category
    if (selectedCategory) {
      const selectedCat = categories.find((c) => c.slug === selectedCategory)

      if (selectedCat) {
        if (!selectedCat.parent) {
          // Parent category - include all child categories
          const childSlugs = categories
            .filter((c) => c.parent?.node.slug === selectedCategory)
            .map((c) => c.slug)

          filtered = filtered.filter((product) =>
            product.productCategories?.nodes.some(
              (cat) =>
                cat.slug === selectedCategory ||
                cat.parent?.node.slug === selectedCategory ||
                childSlugs.includes(cat.slug)
            )
          )
        } else {
          // Child category - exact match
          filtered = filtered.filter((product) =>
            product.productCategories?.nodes.some((cat) => cat.slug === selectedCategory)
          )
        }
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((product) => {
        // Search in product name
        const nameMatch = product.name.toLowerCase().includes(query)
        
        // Search in product descriptions
        const descriptionMatch = 
          product.description?.toLowerCase().includes(query) ||
          product.shortDescription?.toLowerCase().includes(query)
        
        // Search in category names
        const categoryMatch = product.productCategories?.nodes.some(
          (category) => category.name.toLowerCase().includes(query)
        )
        
        return nameMatch || descriptionMatch || categoryMatch
      })
    }

    // Sort products
    filtered.sort((a, b) => {
      const priceA = parseFloat(a.price || a.regularPrice || '0')
      const priceB = parseFloat(b.price || b.regularPrice || '0')

      switch (sortBy) {
        case 'price-asc':
          return priceA - priceB
        case 'price-desc':
          return priceB - priceA
        case 'name-asc':
          return a.name.localeCompare(b.name)
        case 'name-desc':
          return b.name.localeCompare(a.name)
        default:
          return 0
      }
    })

    return filtered
  }, [initialProducts, categories, selectedCategory, searchQuery, sortBy])

  const toggleCategory = (slug: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(slug)) {
      newExpanded.delete(slug)
    } else {
      newExpanded.add(slug)
    }
    setExpandedCategories(newExpanded)
  }

  const handleCategoryChange = (slug: string | null) => {
    setSelectedCategory(slug)
  }

  const handleClearFilters = () => {
    setSelectedCategory(null)
    setSearchQuery('')
    setSortBy('default')
  }

  const hasActiveFilters = selectedCategory || searchQuery || sortBy !== 'default'

  return (
    <div className="flex gap-8">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-24 space-y-6">
          {/* Search */}
          <div>
            <Label htmlFor="search" className="text-sm font-medium mb-2 block">
              Search Products
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Sort */}
          <div>
            <Label htmlFor="sort" className="text-sm font-medium mb-2 block">
              Sort By
            </Label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="default">Default</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
              <option value="name-desc">Name: Z to A</option>
            </select>
          </div>

          {/* Categories */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium">Categories</Label>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-auto p-1 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>
            <div className="space-y-1">
              <button
                onClick={() => handleCategoryChange(null)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  !selectedCategory
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                All Products ({initialProducts.length})
              </button>

              {parentCategories.map((parent) => {
                const children = categories.filter(
                  (cat) => cat.parent?.node.slug === parent.slug
                )
                const isExpanded = expandedCategories.has(parent.slug)

                return (
                  <div key={parent.id}>
                    <div className="flex items-center gap-1">
                      {children.length > 0 && (
                        <button
                          onClick={() => toggleCategory(parent.slug)}
                          className="p-1 hover:bg-muted rounded"
                        >
                          {isExpanded ? (
                            <Minus className="h-3 w-3" />
                          ) : (
                            <Plus className="h-3 w-3" />
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => handleCategoryChange(parent.slug)}
                        className={`flex-1 text-left px-3 py-2 rounded-md text-sm transition-colors ${
                          selectedCategory === parent.slug
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                        }`}
                      >
                        {parent.name} ({categoryCounts.get(parent.slug) || 0})
                      </button>
                    </div>

                    {isExpanded && children.length > 0 && (
                      <div className="ml-6 mt-1 space-y-1">
                        {children.map((child) => (
                          <button
                            key={child.id}
                            onClick={() => handleCategoryChange(child.slug)}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                              selectedCategory === child.slug
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted'
                            }`}
                          >
                            {child.name} ({categoryCounts.get(child.slug) || 0})
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Filter Sheet */}
      <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <div className="lg:hidden fixed bottom-4 right-4 z-50">
          <SheetTrigger asChild>
            <Button size="lg" className="rounded-full shadow-lg">
              <SlidersHorizontal className="h-5 w-5 mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 bg-primary-foreground text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  !
                </span>
              )}
            </Button>
          </SheetTrigger>
        </div>

        <SheetContent side="left" className="w-80 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filter & Sort</SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Same content as desktop sidebar */}
            <div>
              <Label htmlFor="search-mobile" className="text-sm font-medium mb-2 block">
                Search Products
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-mobile"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="sort-mobile" className="text-sm font-medium mb-2 block">
                Sort By
              </Label>
              <select
                id="sort-mobile"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="default">Default</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium">Categories</Label>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="h-auto p-1 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    handleCategoryChange(null)
                    setIsFilterOpen(false)
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    !selectedCategory
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  All Products ({initialProducts.length})
                </button>

                {parentCategories.map((parent) => {
                  const children = categories.filter(
                    (cat) => cat.parent?.node.slug === parent.slug
                  )
                  const isExpanded = expandedCategories.has(parent.slug)

                  return (
                    <div key={parent.id}>
                      <div className="flex items-center gap-1">
                        {children.length > 0 && (
                          <button
                            onClick={() => toggleCategory(parent.slug)}
                            className="p-1 hover:bg-muted rounded"
                          >
                            {isExpanded ? (
                              <Minus className="h-3 w-3" />
                            ) : (
                              <Plus className="h-3 w-3" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            handleCategoryChange(parent.slug)
                            setIsFilterOpen(false)
                          }}
                          className={`flex-1 text-left px-3 py-2 rounded-md text-sm transition-colors ${
                            selectedCategory === parent.slug
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-muted'
                          }`}
                        >
                          {parent.name} ({categoryCounts.get(parent.slug) || 0})
                        </button>
                      </div>

                      {isExpanded && children.length > 0 && (
                        <div className="ml-6 mt-1 space-y-1">
                          {children.map((child) => (
                            <button
                              key={child.id}
                              onClick={() => {
                                handleCategoryChange(child.slug)
                                setIsFilterOpen(false)
                              }}
                              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                selectedCategory === child.slug
                                  ? 'bg-primary text-primary-foreground'
                                  : 'hover:bg-muted'
                              }`}
                            >
                              {child.name} ({categoryCounts.get(child.slug) || 0})
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Products Grid */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            Showing {filteredAndSortedProducts.length} of {initialProducts.length} products
          </p>
        </div>

        {filteredAndSortedProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No products found</p>
            {hasActiveFilters && (
              <Button onClick={handleClearFilters} variant="outline">
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

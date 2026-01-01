'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'

interface Product {
  id: string
  name: string
  slug: string
  productCategories?: {
    nodes: Array<{
      name: string
      slug: string
    }>
  }
}

interface SearchSuggestionsProps {
  products: Product[]
  onSearch: (query: string) => void
  onClose: () => void
  className?: string
  placeholder?: string
}

export function SearchSuggestions({
  products,
  onSearch,
  onClose,
  className = '',
  placeholder = 'Search products...'
}: SearchSuggestionsProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const suggestions = useMemo(() => {
    if (!query.trim() || query.length < 2) return []
    
    const searchTerm = query.toLowerCase()
    const matches: Array<{type: 'product' | 'category', name: string, query: string}> = []
    
    // Get product name matches
    products.forEach(product => {
      if (product.name.toLowerCase().includes(searchTerm)) {
        matches.push({
          type: 'product',
          name: product.name,
          query: product.name
        })
      }
    })
    
    // Get category matches
    const categoryMatches = new Set<string>()
    products.forEach(product => {
      product.productCategories?.nodes.forEach(category => {
        if (category.name.toLowerCase().includes(searchTerm) && !categoryMatches.has(category.name)) {
          categoryMatches.add(category.name)
          matches.push({
            type: 'category',
            name: category.name,
            query: category.name
          })
        }
      })
    })
    
    // Limit and prioritize product matches
    return matches
      .sort((a, b) => {
        if (a.type === 'product' && b.type === 'category') return -1
        if (a.type === 'category' && b.type === 'product') return 1
        return 0
      })
      .slice(0, 6)
  }, [query, products])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query.trim())
      setQuery('')
      setIsOpen(false)
    }
  }

  const handleSuggestionClick = (suggestionQuery: string) => {
    onSearch(suggestionQuery)
    setQuery('')
    setIsOpen(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    setIsOpen(value.length >= 2)
  }

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="flex items-center">
        <Input
          ref={inputRef}
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          className="w-64"
          autoComplete="off"
        />
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          className="ml-1"
        >
          <Search className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="ml-1"
        >
          <X className="h-4 w-4" />
        </Button>
      </form>

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion) => (
            <button
              key={`${suggestion.type}-${suggestion.name}`}
              onClick={() => handleSuggestionClick(suggestion.query)}
              className="w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-2 text-sm"
            >
              <Search className="h-3 w-3 text-muted-foreground" />
              <span>{suggestion.name}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {suggestion.type === 'product' ? 'Product' : 'Category'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
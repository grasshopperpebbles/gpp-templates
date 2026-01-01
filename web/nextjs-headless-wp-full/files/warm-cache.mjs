#!/usr/bin/env node

/**
 * Cache Warming Script for Next.js ISR
 *
 * This script visits all pages in the application to pre-populate the Next.js cache.
 * Run this after deploying or whenever you want to warm the cache.
 *
 * Usage:
 *   node warm-cache.mjs
 *   node warm-cache.mjs --url https://yoursite.com
 *
 * Note: Requires Node.js 18+ (uses built-in fetch)
 */

// Configuration
const BASE_URL = process.argv.includes('--url')
  ? process.argv[process.argv.indexOf('--url') + 1]
  : 'http://localhost:3004'

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:8080/graphql'

// Fetch all products from GraphQL
async function fetchAllProducts() {
  const query = `
    query GetAllProducts {
      products(first: 100) {
        nodes {
          slug
          ... on SimpleProduct {
            productCategories {
              nodes {
                slug
                parent {
                  node {
                    slug
                  }
                }
              }
            }
          }
        }
      }
    }
  `

  try {
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    })

    const result = await response.json()
    if (result.errors) {
      throw new Error(result.errors[0]?.message || 'GraphQL error')
    }

    return result.data.products.nodes
  } catch (error) {
    console.error('❌ Failed to fetch products from GraphQL:', error.message)
    return []
  }
}

// Visit a URL and measure response time
async function visitPage(url, description) {
  const startTime = Date.now()

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'NextJS-Cache-Warmer/1.0',
      },
    })

    const elapsed = Date.now() - startTime
    const status = response.ok ? '✅' : '⚠️ '
    console.log(`${status} ${description.padEnd(50)} ${elapsed}ms ${response.status}`)

    return { success: response.ok, elapsed }
  } catch (error) {
    const elapsed = Date.now() - startTime
    console.log(`❌ ${description.padEnd(50)} ${elapsed}ms ERROR: ${error.message}`)
    return { success: false, elapsed, error: error.message }
  }
}

// Main cache warming function
async function warmCache() {
  console.log('\n🔥 Starting cache warm-up...')
  console.log(`🌐 Target: ${BASE_URL}`)
  console.log(`📊 GraphQL: ${GRAPHQL_URL}\n`)

  const results = {
    total: 0,
    success: 0,
    failed: 0,
    totalTime: 0,
  }

  const pages = []

  // Core pages
  console.log('📄 Warming core pages...')
  pages.push({ url: `${BASE_URL}/`, desc: 'Homepage' })
  pages.push({ url: `${BASE_URL}/products`, desc: 'Products Page' })
  pages.push({ url: `${BASE_URL}/products/categories`, desc: 'Categories Page' })
  pages.push({ url: `${BASE_URL}/about`, desc: 'About Page' })
  pages.push({ url: `${BASE_URL}/contact`, desc: 'Contact Page' })

  // Visit core pages
  for (const page of pages) {
    const result = await visitPage(page.url, page.desc)
    results.total++
    results.totalTime += result.elapsed
    if (result.success) results.success++
    else results.failed++
  }

  // Fetch and visit all product pages
  console.log('\n📦 Fetching product data from WordPress...')
  const products = await fetchAllProducts()

  if (products.length > 0) {
    console.log(`✅ Found ${products.length} products\n`)
    console.log('🛍️  Warming product detail pages...')

    for (const product of products) {
      // Get primary category
      const primaryCategory = product.productCategories?.nodes?.[0]
      if (!primaryCategory) continue

      const parentSlug = primaryCategory.parent?.node?.slug || primaryCategory.slug
      const childSlug = primaryCategory.parent?.node?.slug
        ? primaryCategory.slug
        : primaryCategory.slug

      const url = `${BASE_URL}/products/${parentSlug}/${childSlug}/${product.slug}`
      const desc = `Product: ${product.slug}`

      const result = await visitPage(url, desc)
      results.total++
      results.totalTime += result.elapsed
      if (result.success) results.success++
      else results.failed++

      // Add small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  } else {
    console.log('⚠️  No products found. Skipping product pages.')
  }

  // Summary
  console.log('\n' + '='.repeat(70))
  console.log('📊 Cache Warming Complete!')
  console.log('='.repeat(70))
  console.log(`✅ Success: ${results.success}/${results.total} pages`)
  console.log(`❌ Failed:  ${results.failed}/${results.total} pages`)
  console.log(`⏱️  Total time: ${(results.totalTime / 1000).toFixed(2)}s`)
  console.log(`⚡ Average: ${(results.totalTime / results.total).toFixed(0)}ms per page`)
  console.log('='.repeat(70) + '\n')

  if (results.failed > 0) {
    console.log('⚠️  Some pages failed to load. Check the errors above.')
    process.exit(1)
  }
}

// Run the script
warmCache().catch((error) => {
  console.error('\n❌ Fatal error:', error)
  process.exit(1)
})

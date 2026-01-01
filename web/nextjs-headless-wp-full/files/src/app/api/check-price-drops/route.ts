import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { getWishlist, updateWishlist, type WishlistItem } from '@/lib/customer-api'
import { getAdminSettings } from '@/lib/admin-settings'

// GraphQL query to get product prices
const GET_PRODUCTS_PRICES = `
  query GetProductsPrices($ids: [ID!]) {
    products(where: { in: $ids }) {
      nodes {
        databaseId
        name
        price
        regularPrice
        salePrice
        onSale
      }
    }
  }
`

interface PriceDrop {
  item: WishlistItem
  oldPrice: number
  newPrice: number
  dropPercentage: number
}

interface ProductPrice {
  databaseId: number
  name: string
  price: string
  regularPrice: string
  salePrice: string | null
  onSale: boolean
}

/**
 * Check for price drops in user's wishlist
 * GET /api/check-price-drops
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.authToken || !session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if price drop notifications are enabled
    const settings = getAdminSettings()
    if (!settings.priceDropNotifications.enabled) {
      return NextResponse.json({
        enabled: false,
        message: 'Price drop notifications are disabled',
      })
    }

    // Get user's wishlist
    const wishlist = await getWishlist(session.customerId, session.authToken)

    if (!wishlist || wishlist.length === 0) {
      return NextResponse.json({ priceDrops: [], message: 'No items in wishlist' })
    }

    // Get product IDs
    const productIds = wishlist.map((item) => item.productId)

    // Fetch current prices from WooCommerce
    const response = await fetch(process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:8080/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.authToken}`,
      },
      body: JSON.stringify({
        query: GET_PRODUCTS_PRICES,
        variables: { ids: productIds },
      }),
    })

    const result = await response.json()

    if (result.errors) {
      console.error('GraphQL error:', result.errors)
      return NextResponse.json({ error: 'Failed to fetch product prices' }, { status: 500 })
    }

    const products = result.data?.products?.nodes || []

    // Check for price drops
    const priceDrops: PriceDrop[] = []
    const updatedWishlist: WishlistItem[] = []

    for (const item of wishlist) {
      const product = products.find((p: ProductPrice) => p.databaseId.toString() === item.productId)

      if (!product) {
        // Product not found, keep original item
        updatedWishlist.push(item)
        continue
      }

      // Get current price (sale price if on sale, otherwise regular price)
      const currentPriceStr = product.salePrice || product.price || product.regularPrice
      const currentPrice = parseFloat(currentPriceStr?.replace('$', '') || '0')

      // Ensure price tracking fields exist (for legacy items)
      const lastCheckedPrice = item.lastCheckedPrice
        ? parseFloat(item.lastCheckedPrice.replace('$', ''))
        : parseFloat(item.price.replace('$', ''))

      // Check if enough time has passed since last check
      const now = Date.now()
      const checkIntervalMs = settings.priceDropNotifications.checkIntervalHours * 60 * 60 * 1000
      const timeSinceLastCheck = now - (item.lastCheckedAt || item.addedAt)

      const shouldCheckPrice = timeSinceLastCheck >= checkIntervalMs
      let priceDropDetected = false

      if (shouldCheckPrice && currentPrice < lastCheckedPrice) {
        // Calculate drop percentage
        const dropPercentage = ((lastCheckedPrice - currentPrice) / lastCheckedPrice) * 100

        // Check if drop meets minimum threshold
        if (dropPercentage >= settings.priceDropNotifications.minimumDropPercentage) {
          priceDropDetected = true

          // Only notify if user hasn't been notified about this price drop yet
          if (!item.priceDropNotified || currentPrice < parseFloat(item.lastCheckedPrice.replace('$', ''))) {
            priceDrops.push({
              item: {
                ...item,
                price: product.regularPrice || currentPriceStr,
                salePrice: product.salePrice,
                onSale: product.onSale || false,
              },
              oldPrice: lastCheckedPrice,
              newPrice: currentPrice,
              dropPercentage: Math.round(dropPercentage),
            })
          }
        }
      }

      // Update item with latest price info
      updatedWishlist.push({
        ...item,
        price: product.regularPrice || currentPriceStr,
        salePrice: product.salePrice,
        onSale: product.onSale || false,
        lastCheckedPrice: currentPriceStr,
        lastCheckedAt: shouldCheckPrice ? now : item.lastCheckedAt,
        priceDropNotified: priceDropDetected ? true : item.priceDropNotified,
        // Keep original price unchanged
        originalPrice: item.originalPrice || item.price,
      })
    }

    // Update wishlist with new price information
    if (updatedWishlist.length > 0) {
      await updateWishlist(session.customerId.toString(), updatedWishlist, session.authToken)
    }

    return NextResponse.json({
      enabled: true,
      priceDrops,
      checkedItems: wishlist.length,
      settings: {
        checkIntervalHours: settings.priceDropNotifications.checkIntervalHours,
        minimumDropPercentage: settings.priceDropNotifications.minimumDropPercentage,
      },
    })
  } catch (error) {
    console.error('Error checking price drops:', error)
    return NextResponse.json(
      { error: 'Failed to check price drops' },
      { status: 500 }
    )
  }
}

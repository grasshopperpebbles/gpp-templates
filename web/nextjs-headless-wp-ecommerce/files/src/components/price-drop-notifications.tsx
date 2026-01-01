'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, TrendingDown } from 'lucide-react'

interface PriceDrop {
  item: {
    id: string
    productId: string
    name: string
    price: string
    salePrice?: string
    image?: string
    slug: string
    category: string
    subCategory: string
  }
  oldPrice: number
  newPrice: number
  dropPercentage: number
}

export function PriceDropNotifications() {
  const { data: session, status } = useSession()
  const [priceDrops, setPriceDrops] = useState<PriceDrop[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  const checkForPriceDrops = useCallback(async () => {
    if (isChecking) return

    setIsChecking(true)

    try {
      const response = await fetch('/api/check-price-drops')
      const data = await response.json()

      if (data.enabled && data.priceDrops && data.priceDrops.length > 0) {
        // Check user preferences
        const prefsResponse = await fetch(process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:8080/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.authToken}`,
          },
          body: JSON.stringify({
            query: `
              query GetNotificationPreferences($customerId: Int!) {
                customer(customerId: $customerId) {
                  id
                  metaData(key: "notification_preferences") {
                    key
                    value
                  }
                }
              }
            `,
            variables: { customerId: session?.customerId },
          }),
        })

        const prefsResult = await prefsResponse.json()
        const prefsData = prefsResult.data?.customer?.metaData

        let preferences = {
          priceDropNotificationsEnabled: true,
          inAppNotifications: true,
        }

        if (prefsData && prefsData.value) {
          preferences = JSON.parse(prefsData.value)
        }

        // Only show if user has enabled in-app notifications
        if (preferences.priceDropNotificationsEnabled && preferences.inAppNotifications) {
          setPriceDrops(data.priceDrops)
          setIsVisible(true)
        }
      }
    } catch (error) {
      console.error('Error checking for price drops:', error)
    } finally {
      setIsChecking(false)
    }
  }, [isChecking, session?.authToken, session?.customerId])

  useEffect(() => {
    if (status === 'authenticated' && session?.authToken) {
      checkForPriceDrops()
    }
  }, [status, session?.authToken, checkForPriceDrops])

  const handleDismiss = () => {
    setIsVisible(false)
    setPriceDrops([])
  }

  if (!isVisible || priceDrops.length === 0) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-full max-w-md">
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-lg">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-full">
                <TrendingDown className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900">Price Drop Alert!</h3>
                <p className="text-xs text-green-700">
                  {priceDrops.length} {priceDrops.length === 1 ? 'item' : 'items'} in your wishlist
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-green-100 rounded-full transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4 text-green-700" />
            </button>
          </div>

          {/* Price Drops List */}
          <div className="space-y-2 mb-3">
            {priceDrops.slice(0, 3).map((drop) => (
              <Link
                key={drop.item.id}
                href={`/products/${drop.item.category}/${drop.item.subCategory}/${drop.item.slug}`}
                className="block"
              >
                <div className="flex items-center gap-3 p-2 bg-white rounded-lg hover:bg-green-50 transition-colors">
                  {drop.item.image && (
                    <div className="relative w-12 h-12">
                      <Image
                        src={drop.item.image}
                        alt={drop.item.name}
                        fill
                        className="object-cover rounded"
                        sizes="48px"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">
                      {drop.item.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs line-through text-gray-500">
                        ${drop.oldPrice.toFixed(2)}
                      </span>
                      <span className="text-sm font-bold text-green-600">
                        ${drop.newPrice.toFixed(2)}
                      </span>
                      <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                        {drop.dropPercentage}% OFF
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button asChild size="sm" className="flex-1 bg-green-600 hover:bg-green-700">
              <Link href="/my-account/wishlist">View Wishlist</Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDismiss}
              className="border-green-200 hover:bg-green-50"
            >
              Dismiss
            </Button>
          </div>

          {priceDrops.length > 3 && (
            <p className="text-xs text-center text-green-700 mt-2">
              +{priceDrops.length - 3} more {priceDrops.length - 3 === 1 ? 'item' : 'items'} with price drops
            </p>
          )}
        </div>
      </Card>
    </div>
  )
}

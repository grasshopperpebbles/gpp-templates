'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getWishlist, addToWishlist, removeFromWishlist, type WishlistItem } from '@/lib/customer-api'
import { cn } from '@/lib/utils'

interface WishlistButtonProps {
  productId: string
  productName: string
  productPrice: string
  productSalePrice?: string
  productImage?: string
  productSlug: string
  productCategory: string
  productSubCategory: string
  onSale: boolean
  variant?: 'default' | 'icon'
  className?: string
}

export function WishlistButton({
  productId,
  productName,
  productPrice,
  productSalePrice,
  productImage,
  productSlug,
  productCategory,
  productSubCategory,
  onSale,
  variant = 'default',
  className,
}: WishlistButtonProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    checkWishlistStatus()
  }, [session, status, productId])

  const checkWishlistStatus = async () => {
    if (status === 'authenticated' && session?.authToken && session?.customerId) {
      try {
        const wishlist = await getWishlist(session.customerId, session.authToken)
        const inWishlist = wishlist.some((item) => item.productId === productId)
        setIsInWishlist(inWishlist)
      } catch (error) {
        console.error('Error checking wishlist status:', error)
      }
    }
  }

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (status !== 'authenticated') {
      router.push('/login')
      return
    }

    if (!session?.authToken || !session?.customerId) {
      return
    }

    setIsLoading(true)

    try {
      if (isInWishlist) {
        // Remove from wishlist
        const wishlist = await getWishlist(session.customerId, session.authToken)
        const itemToRemove = wishlist.find((item) => item.productId === productId)

        if (itemToRemove) {
          const success = await removeFromWishlist(
            session.customerId.toString(),
            itemToRemove.id,
            session.authToken
          )

          if (success) {
            setIsInWishlist(false)
          }
        }
      } else {
        // Add to wishlist
        const currentPrice = productSalePrice || productPrice
        const wishlistItem: WishlistItem = {
          id: `wishlist-${Date.now()}`,
          productId,
          name: productName,
          price: productPrice,
          salePrice: productSalePrice,
          image: productImage,
          slug: productSlug,
          category: productCategory,
          subCategory: productSubCategory,
          onSale,
          addedAt: Date.now(),
          // Price tracking fields
          originalPrice: currentPrice,
          lastCheckedPrice: currentPrice,
          lastCheckedAt: Date.now(),
          priceDropNotified: false,
        }

        const success = await addToWishlist(
          session.customerId.toString(),
          wishlistItem,
          session.authToken
        )

        if (success) {
          setIsInWishlist(true)
        }
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={handleToggleWishlist}
        disabled={isLoading}
        className={cn(
          'p-2 rounded-full transition-all',
          'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary',
          isInWishlist ? 'text-red-500' : 'text-gray-400 hover:text-red-500',
          isLoading && 'opacity-50 cursor-not-allowed',
          className
        )}
        aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <Heart
          className={cn('h-5 w-5 transition-all', isInWishlist && 'fill-current')}
        />
      </button>
    )
  }

  return (
    <Button
      variant="outline"
      onClick={handleToggleWishlist}
      disabled={isLoading}
      className={cn(
        'inline-flex items-center gap-2',
        isInWishlist && 'border-red-500 text-red-500 hover:bg-red-50',
        className
      )}
    >
      <Heart
        className={cn(
          'h-4 w-4 transition-all',
          isInWishlist && 'fill-current text-red-500'
        )}
      />
      {isLoading ? 'Updating...' : isInWishlist ? 'In Wishlist' : 'Add to Wishlist'}
    </Button>
  )
}

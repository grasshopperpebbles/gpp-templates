'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getWishlist, updateWishlist, type WishlistItem } from '@/lib/customer-api'
import {
  Heart,
  ShoppingBag,
  ArrowLeft,
  Trash2,
  ShoppingCart,
  ExternalLink
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useCart } from '@/store/cart'

// WishlistItem interface imported from customer-api

export default function WishlistPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { addItem } = useCart()
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const [removeConfirmId, setRemoveConfirmId] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    loadWishlist()
  }, [session, status, router])

  const loadWishlist = async () => {
    if (!session?.authToken || !session?.customerId) return

    try {
      const items = await getWishlist(session.customerId, session.authToken)
      setWishlist(items)
    } catch (error) {
      console.error('Error loading wishlist:', error)
      setWishlist([])
    }
  }

  const saveWishlist = async (items: WishlistItem[]) => {
    if (!session?.authToken || !session?.customerId) return false

    setWishlist(items)

    try {
      const success = await updateWishlist(
        session.customerId.toString(),
        items,
        session.authToken
      )

      if (!success) {
        console.error('Failed to save wishlist to WooCommerce')
        return false
      }

      return true
    } catch (error) {
      console.error('Error saving wishlist:', error)
      return false
    }
  }

  const handleRemoveItem = (id: string) => {
    setRemoveConfirmId(id)
  }

  const confirmRemove = async () => {
    if (removeConfirmId) {
      const newWishlist = wishlist.filter(item => item.id !== removeConfirmId)
      const success = await saveWishlist(newWishlist)

      if (success) {
        setRemoveConfirmId(null)
      } else {
        alert('Failed to remove item. Please try again.')
        setRemoveConfirmId(null)
      }
    }
  }

  const handleAddToCart = (item: WishlistItem) => {
    addItem({
      id: parseInt(item.productId),
      name: item.name,
      slug: item.slug,
      price: item.salePrice || item.price,
      image: item.image
    })

    // Optionally remove from wishlist after adding to cart
    // const newWishlist = wishlist.filter(w => w.id !== item.id)
    // saveWishlist(newWishlist)
  }

  const handleClearWishlist = async () => {
    if (wishlist.length > 0 && confirm('Are you sure you want to clear your entire wishlist?')) {
      const success = await saveWishlist([])

      if (!success) {
        alert('Failed to clear wishlist. Please try again.')
      }
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Added today'
    if (diffDays === 1) return 'Added yesterday'
    if (diffDays < 7) return `Added ${diffDays} days ago`
    if (diffDays < 30) return `Added ${Math.floor(diffDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/" className="inline-flex items-center gap-2 text-xl font-semibold">
              <ShoppingBag className="h-6 w-6" />
              FU Store
            </Link>
            <span className="text-gray-400">/</span>
            <Link href="/my-account" className="text-gray-600 hover:text-gray-900">
              My Account
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-600">Wishlist</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" asChild>
                <Link href="/my-account" className="inline-flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Account
                </Link>
              </Button>

              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Heart className="h-8 w-8 text-red-500" />
                  Your Wishlist
                </h1>
                <p className="text-muted-foreground mt-1">
                  {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved for later
                </p>
              </div>
            </div>

            {wishlist.length > 0 && (
              <Button
                variant="outline"
                onClick={handleClearWishlist}
                className="text-red-600 hover:text-red-700"
              >
                Clear Wishlist
              </Button>
            )}
          </div>
        </div>

        {/* Wishlist Items */}
        {wishlist.length === 0 ? (
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Your Wishlist is Empty</h2>
                <p className="text-muted-foreground mb-6">
                  Browse our products and add items to your wishlist by clicking the heart icon.
                </p>
                <Button asChild>
                  <Link href="/products">
                    Start Shopping
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {wishlist.map(item => (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative aspect-square bg-gray-100">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <ShoppingBag className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                  {item.onSale && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 text-xs font-semibold rounded">
                      SALE
                    </span>
                  )}
                </div>

                <CardContent className="p-4">
                  <div className="mb-3">
                    <Link
                      href={`/products/${item.category}/${item.subCategory}/${item.slug}`}
                      className="font-semibold hover:text-primary transition-colors line-clamp-2"
                    >
                      {item.name}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(item.addedAt)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    {item.onSale && item.salePrice ? (
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-red-600">{item.salePrice}</span>
                        <span className="text-sm text-gray-500 line-through">{item.price}</span>
                      </div>
                    ) : (
                      <span className="text-lg font-bold">{item.price}</span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleAddToCart(item)}
                      className="flex-1 inline-flex items-center gap-2"
                      size="sm"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Add to Cart
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <Link href={`/products/${item.category}/${item.subCategory}/${item.slug}`}>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info Card */}
        {wishlist.length > 0 && (
          <Card className="mt-6 bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <p className="text-sm text-blue-900">
                💡 <strong>Tip:</strong> Items in your wishlist are saved across all your devices.
                We&apos;ll notify you if any of them go on sale!
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={removeConfirmId !== null} onOpenChange={() => setRemoveConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Wishlist?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this item from your wishlist?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemove} className="bg-red-500 hover:bg-red-600">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

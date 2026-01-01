'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CouponInput } from '@/components/coupon-input'
import { useCart } from '@/store/cart'
import { formatPrice } from '@/lib/utils'
import { addToWishlist, type WishlistItem } from '@/lib/customer-api'
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  Heart,
} from 'lucide-react'

export default function CartPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const {
    items,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
    isLoading,
    error,
    discountTotal,
  } = useCart()

  const [savingItemId, setSavingItemId] = useState<number | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  // Calculate estimated totals (exact amounts calculated at checkout)
  const subtotal = getTotalPrice()
  const discount = parseFloat(discountTotal) || 0
  // Note: Exact tax and shipping will be calculated based on your address at checkout
  const estimatedShipping = subtotal > 50 ? 0 : 5.99 // Starting at $5.99, free shipping over $50
  const estimatedTax = 0 // Tax calculated based on your address at checkout
  const estimatedTotal = Math.max(0, subtotal - discount + estimatedShipping + estimatedTax)

  const handleSaveForLater = async (item: typeof items[0]) => {
    // Check authentication
    if (status !== 'authenticated' || !session?.authToken || !session?.customerId) {
      router.push('/login?redirect=/cart')
      return
    }

    setSavingItemId(item.id)
    setSaveMessage(null)

    try {
      // Create wishlist item from cart item
      const currentPrice = item.price
      const wishlistItem: WishlistItem = {
        id: `wishlist-${Date.now()}`,
        productId: item.id.toString(),
        name: item.name,
        price: currentPrice,
        salePrice: undefined, // Cart doesn't track sale price
        image: item.image,
        slug: item.slug,
        category: '', // Cart doesn't track category - will show in "Uncategorized"
        subCategory: '',
        onSale: false,
        addedAt: Date.now(),
        originalPrice: currentPrice,
        lastCheckedPrice: currentPrice,
        lastCheckedAt: Date.now(),
        priceDropNotified: false,
      }

      // Add to wishlist
      const success = await addToWishlist(
        session.customerId.toString(),
        wishlistItem,
        session.authToken
      )

      if (success) {
        // Remove from cart
        removeFromCart(item.id)
        setSaveMessage(`${item.name} moved to wishlist!`)
        setTimeout(() => setSaveMessage(null), 3000)
      } else {
        setSaveMessage('Failed to save item. Please try again.')
        setTimeout(() => setSaveMessage(null), 3000)
      }
    } catch (error) {
      console.error('Error saving for later:', error)
      setSaveMessage('Failed to save item. Please try again.')
      setTimeout(() => setSaveMessage(null), 3000)
    } finally {
      setSavingItemId(null)
    }
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-md mx-auto">
          <div className="mb-6 flex justify-center">
            <div className="p-6 rounded-full bg-muted">
              <ShoppingBag className="h-16 w-16 text-muted-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8">
            Looks like you haven&apos;t added anything to your cart yet.
          </p>
          <Button asChild size="lg">
            <Link href="/products">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Continue Shopping
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Shopping Cart</h1>
        <p className="text-muted-foreground">
          {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'} in your cart
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {saveMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <Heart className="h-5 w-5 fill-current" />
          {saveMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 p-4 border rounded-lg bg-card hover:shadow-md transition-shadow"
            >
              {/* Product Image */}
              <Link
                href={`/products/${item.slug}`}
                className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100"
              >
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="text-gray-400 text-xs">No image</span>
                  </div>
                )}
              </Link>

              {/* Product Details */}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/products/${item.slug}`}
                  className="font-semibold text-lg hover:text-primary line-clamp-2 mb-2"
                >
                  {item.name}
                </Link>
                <p className="text-xl font-bold text-primary mb-3">
                  {formatPrice(item.price)}
                </p>

                {/* Quantity Controls */}
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border rounded-md">
                      <button
                        onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                        disabled={isLoading || item.quantity <= 1}
                        className="px-3 py-1 hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="px-4 py-1 min-w-[3rem] text-center border-x">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                        disabled={isLoading}
                        className="px-3 py-1 hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleSaveForLater(item)}
                      disabled={isLoading || savingItemId === item.id}
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      aria-label="Save for later"
                    >
                      <Heart className="h-4 w-4" />
                      {savingItemId === item.id ? 'Saving...' : 'Save for Later'}
                    </button>

                    <span className="text-gray-300">|</span>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      disabled={isLoading}
                      className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>

              {/* Item Subtotal */}
              <div className="text-right">
                <p className="font-semibold text-lg">
                  {formatPrice((parseFloat(item.price) * item.quantity).toFixed(2))}
                </p>
                {item.quantity > 1 && (
                  <p className="text-sm text-muted-foreground">
                    {item.quantity} × {formatPrice(item.price)}
                  </p>
                )}
              </div>
            </div>
          ))}

          {/* Clear Cart Button */}
          <div className="flex justify-end pt-4">
            <Button
              variant="outline"
              onClick={clearCart}
              disabled={isLoading}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear Cart
            </Button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="border rounded-lg p-6 sticky top-8 bg-card">
            <h2 className="text-2xl font-bold mb-6">Order Summary</h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-base">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatPrice(subtotal.toFixed(2))}</span>
              </div>

              {/* Discount display */}
              {discount > 0 && (
                <div className="flex justify-between text-base text-green-600">
                  <span>Discount</span>
                  <span className="font-medium">-{formatPrice(discount.toFixed(2))}</span>
                </div>
              )}

              <div className="flex justify-between text-base">
                <span className="text-muted-foreground">Estimated Shipping</span>
                <span className="font-medium">
                  {estimatedShipping === 0 ? (
                    <span className="text-green-600">FREE</span>
                  ) : (
                    `From ${formatPrice(estimatedShipping.toFixed(2))}`
                  )}
                </span>
              </div>

              {subtotal > 0 && subtotal < 50 && (
                <div className="text-sm text-muted-foreground bg-blue-50 border border-blue-200 rounded-lg p-3">
                  Add {formatPrice((50 - subtotal).toFixed(2))} more for free shipping!
                </div>
              )}

              <div className="flex justify-between text-base">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-medium text-xs text-muted-foreground">Calculated at checkout</span>
              </div>

              <div className="text-xs text-muted-foreground bg-yellow-50 border border-yellow-200 rounded-lg p-3 my-2">
                <strong>Note:</strong> Exact tax and shipping will be calculated based on your address at checkout.
              </div>

              <Separator />

              <div className="flex justify-between text-xl font-bold">
                <span>Estimated Total</span>
                <span>{formatPrice(estimatedTotal.toFixed(2))}</span>
              </div>
            </div>

            {/* Coupon Input Section */}
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-3">Have a coupon?</h3>
              <CouponInput />
            </div>

            <Button asChild size="lg" className="w-full mb-4">
              <Link href="/checkout">
                Proceed to Checkout
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>

            <Button asChild variant="outline" size="lg" className="w-full">
              <Link href="/products">
                <ArrowLeft className="mr-2 h-5 w-5" />
                Continue Shopping
              </Link>
            </Button>

            {/* Features */}
            <Separator className="my-6" />

            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Free shipping on orders over $50</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Secure checkout with SSL encryption</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>30-day money-back guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ShoppingCart, Ruler, Facebook, Twitter, Link2, Share2 } from 'lucide-react'
import { useCart } from '@/store/cart'
import type { Product } from '@/lib/graphql'
import { WishlistButton } from '@/components/wishlist-button'

interface ProductDetailClientProps {
  product: Product
  allImages: Array<{ id: string; sourceUrl: string; altText: string }>
  isInStock: boolean
  stockQuantity: number
  showLowStockWarning: boolean
}

// Available sizes and colors
const AVAILABLE_SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL']
const AVAILABLE_COLORS = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Navy', hex: '#001F3F' },
  { name: 'Gray', hex: '#808080' },
  { name: 'Red', hex: '#FF4136' },
]

export function ProductDetailClient({
  product,
  allImages,
  isInStock,
  stockQuantity,
  showLowStockWarning,
}: ProductDetailClientProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [selectedSize, setSelectedSize] = useState<string>('M') // Default to M
  const [selectedColor, setSelectedColor] = useState<string>('Black') // Default to Black
  const [linkCopied, setLinkCopied] = useState(false)
  const { addToCart, isLoading: isAddingToCart } = useCart()

  const handleAddToCart = async () => {
    if (!isInStock) return

    await addToCart({
      id: product.databaseId,
      name: product.name,
      slug: product.slug,
      price: product.price || product.regularPrice || '0',
      image: product.image?.sourceUrl || '',
    }, quantity)
  }

  const handleShare = (platform: string) => {
    const url = window.location.href
    const text = `Check out ${product.name}!`

    if (platform === 'facebook') {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        '_blank'
      )
    } else if (platform === 'twitter') {
      window.open(
        `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
        '_blank'
      )
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(url)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    }
  }

  return (
    <div className="space-y-6">
      {/* Main Image */}
      <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
        <Image
          src={allImages[selectedImageIndex]?.sourceUrl || '/placeholder-product.jpg'}
          alt={allImages[selectedImageIndex]?.altText || product.name}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      </div>

      {/* Thumbnail Gallery */}
      {allImages.length > 1 && (
        <div className="grid grid-cols-6 gap-2">
          {allImages.map((img, index) => (
            <button
              key={img.id}
              onClick={() => setSelectedImageIndex(index)}
              className={`relative aspect-square overflow-hidden rounded-md border-2 transition-all ${
                selectedImageIndex === index
                  ? 'border-blue-600 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <Image
                src={img.sourceUrl}
                alt={img.altText || `${product.name} thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="100px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Size Selector */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Size: <span className="font-bold">{selectedSize}</span>
        </label>
        <div className="flex gap-2 flex-wrap">
          {AVAILABLE_SIZES.map((size) => (
            <button
              key={size}
              onClick={() => setSelectedSize(size)}
              className={`px-4 py-2 border-2 rounded-md font-medium transition-all ${
                selectedSize === size
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="link" className="mt-2 px-0">
              <Ruler className="h-4 w-4 mr-1" />
              Size Guide
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Size Guide</DialogTitle>
              <DialogDescription>
                Find your perfect fit with our size chart
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left">Size</th>
                    <th className="py-2 text-left">Chest (in)</th>
                    <th className="py-2 text-left">Length (in)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2">S</td>
                    <td className="py-2">34-36</td>
                    <td className="py-2">28</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">M</td>
                    <td className="py-2">38-40</td>
                    <td className="py-2">29</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">L</td>
                    <td className="py-2">42-44</td>
                    <td className="py-2">30</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">XL</td>
                    <td className="py-2">46-48</td>
                    <td className="py-2">31</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">XXL</td>
                    <td className="py-2">50-52</td>
                    <td className="py-2">32</td>
                  </tr>
                  <tr>
                    <td className="py-2">XXXL</td>
                    <td className="py-2">54-56</td>
                    <td className="py-2">33</td>
                  </tr>
                </tbody>
              </table>
              <p className="text-xs text-gray-600 mt-4">
                All measurements are approximate. If you&apos;re between sizes, we recommend sizing
                up for a more comfortable fit.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Color Selector */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Color: <span className="font-bold">{selectedColor}</span>
        </label>
        <div className="flex gap-2">
          {AVAILABLE_COLORS.map((color) => (
            <button
              key={color.name}
              onClick={() => setSelectedColor(color.name)}
              className={`w-10 h-10 rounded-full border-2 transition-all ${
                selectedColor === color.name
                  ? 'border-blue-600 ring-2 ring-blue-200 scale-110'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              style={{ backgroundColor: color.hex }}
              title={color.name}
              aria-label={color.name}
            >
              {color.hex === '#FFFFFF' && (
                <span className="block w-full h-full rounded-full border border-gray-200" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Quantity */}
      <div>
        <label className="block text-sm font-medium mb-2">Quantity</label>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
          >
            -
          </Button>
          <span className="text-lg font-semibold w-12 text-center">{quantity}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setQuantity(Math.min(stockQuantity || 999, quantity + 1))
            }
            disabled={!isInStock || quantity >= (stockQuantity || 999)}
          >
            +
          </Button>
        </div>
      </div>

      {/* Add to Cart and Wishlist Buttons */}
      <div className="flex gap-3">
        <Button
          size="lg"
          className="flex-1"
          onClick={handleAddToCart}
          disabled={!isInStock || isAddingToCart}
        >
          <ShoppingCart className="mr-2 h-5 w-5" />
          {isAddingToCart ? 'Adding...' : isInStock ? 'Add to Cart' : 'Out of Stock'}
        </Button>
        <WishlistButton
          productId={product.databaseId.toString()}
          productName={product.name}
          productPrice={product.price || product.regularPrice || '0'}
          productSalePrice={product.salePrice}
          productImage={product.image?.sourceUrl}
          productSlug={product.slug}
          productCategory={product.productCategories?.nodes[0]?.parent?.node?.slug || product.productCategories?.nodes[0]?.slug || ''}
          productSubCategory={product.productCategories?.nodes[0]?.slug || ''}
          onSale={product.onSale || false}
          variant="default"
          className="min-w-[180px]"
        />
      </div>

      {/* Social Sharing */}
      <div className="flex items-center justify-between pt-4 border-t">
        <span className="text-sm font-medium">Share:</span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleShare('facebook')}
          >
            <Facebook className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleShare('twitter')}
          >
            <Twitter className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleShare('copy')}
          >
            {linkCopied ? (
              <span className="text-xs">Copied!</span>
            ) : (
              <Link2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

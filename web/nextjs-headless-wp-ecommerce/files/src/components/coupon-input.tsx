'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCart } from '@/store/cart'
import { formatPrice } from '@/lib/utils'
import { Tag, X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

export function CouponInput() {
  const {
    appliedCoupons,
    discountTotal,
    isCouponLoading,
    couponError,
    applyCoupon,
    removeCoupon,
  } = useCart()

  const [couponCode, setCouponCode] = useState('')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!couponCode.trim()) return

    setSuccessMessage(null)
    const success = await applyCoupon(couponCode)
    if (success) {
      setCouponCode('')
      setSuccessMessage('Coupon applied successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    }
  }

  const handleRemoveCoupon = async (code: string) => {
    setSuccessMessage(null)
    await removeCoupon(code)
  }

  const hasDiscount = parseFloat(discountTotal) > 0

  return (
    <div className="space-y-4">
      {/* Coupon Input Form */}
      <form onSubmit={handleApplyCoupon} className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Enter coupon code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            disabled={isCouponLoading}
            className="pl-9 uppercase"
          />
        </div>
        <Button
          type="submit"
          variant="outline"
          disabled={isCouponLoading || !couponCode.trim()}
        >
          {isCouponLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Apply'
          )}
        </Button>
      </form>

      {/* Error Message */}
      {couponError && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{couponError}</span>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-3">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Applied Coupons */}
      {appliedCoupons.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Applied Coupons:</p>
          <div className="space-y-2">
            {appliedCoupons.map((coupon) => (
              <div
                key={coupon.code}
                className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3"
              >
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-green-600" />
                  <span className="font-mono font-medium text-green-700 uppercase">
                    {coupon.code}
                  </span>
                  <span className="text-green-600 text-sm">
                    (-{formatPrice(coupon.discountAmount)})
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveCoupon(coupon.code)}
                  disabled={isCouponLoading}
                  className="p-1 hover:bg-green-100 rounded-full transition-colors disabled:opacity-50"
                  aria-label={`Remove coupon ${coupon.code}`}
                >
                  {isCouponLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                  ) : (
                    <X className="h-4 w-4 text-green-600" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Total Discount Summary */}
      {hasDiscount && (
        <div className="flex justify-between text-sm text-green-600 font-medium pt-2 border-t">
          <span>Total Discount</span>
          <span>-{formatPrice(discountTotal)}</span>
        </div>
      )}
    </div>
  )
}

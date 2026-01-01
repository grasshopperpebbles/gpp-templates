'use client'

import { Suspense, useEffect, useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { getOrder, type WooCommerceOrder } from '@/lib/orders'
import { formatPrice } from '@/lib/utils'
import {
  CheckCircle,
  Package,
  Mail,
  Home,
  ShoppingBag,
  MapPin,
  CreditCard,
} from 'lucide-react'

function OrderConfirmationContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session } = useSession()
  const orderId = searchParams.get('order')

  const [order, setOrder] = useState<WooCommerceOrder | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const emailSentRef = useRef(false)

  useEffect(() => {
    if (!orderId) {
      router.push('/')
      return
    }

    const loadOrder = async () => {
      if (!session?.authToken) {
        setIsLoading(false)
        return
      }

      try {
        const orderData = await getOrder(parseInt(orderId), session.authToken)
        if (orderData) {
          setOrder(orderData)
        } else {
          setError('Order not found')
        }
      } catch (err) {
        console.error('Error loading order:', err)
        setError('Failed to load order details')
      } finally {
        setIsLoading(false)
      }
    }

    loadOrder()
  }, [orderId, router, session?.authToken])

  // Send order confirmation email (once when order loads)
  useEffect(() => {
    if (!order || emailSentRef.current) return
    emailSentRef.current = true

    const sendConfirmationEmail = async () => {
      try {
        const response = await fetch('/api/email/order-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderNumber: order.orderNumber,
            customerName: `${order.billing.firstName} ${order.billing.lastName}`,
            customerEmail: order.billing.email,
            items: order.lineItems.nodes.map((item) => ({
              name: item.product.node.name,
              quantity: item.quantity,
              price: item.product.node.price || '0',
              total: item.total,
              image: item.product.node.image?.sourceUrl,
            })),
            subtotal: order.subtotal,
            shipping: order.shippingTotal,
            tax: order.totalTax,
            total: order.total,
            shippingAddress: {
              firstName: order.shipping.firstName,
              lastName: order.shipping.lastName,
              address1: order.shipping.address1,
              address2: order.shipping.address2,
              city: order.shipping.city,
              state: order.shipping.state,
              postcode: order.shipping.postcode,
              country: order.shipping.country,
            },
            billingAddress: {
              firstName: order.billing.firstName,
              lastName: order.billing.lastName,
              address1: order.billing.address1,
              address2: order.billing.address2,
              city: order.billing.city,
              state: order.billing.state,
              postcode: order.billing.postcode,
              country: order.billing.country,
            },
            paymentMethod: order.paymentMethodTitle,
            orderDate: order.date,
          }),
        })

        const result = await response.json()
        if (result.skipped) {
          console.log('Order confirmation email skipped:', result.message)
        } else if (result.success) {
          console.log('Order confirmation email sent:', result.emailId)
        } else {
          console.error('Failed to send order confirmation email:', result.message)
        }
      } catch (err) {
        // Non-blocking - don't show error to user, just log it
        console.error('Error sending order confirmation email:', err)
      }
    }

    sendConfirmationEmail()
  }, [order])

  if (!orderId) {
    return null
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-red-600">{error || 'Order not found'}</p>
          <Button asChild className="mt-4">
            <Link href="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Order Confirmed!
          </h1>
          <p className="text-lg text-muted-foreground">
            Thank you for your purchase
          </p>
        </div>

        {/* Order Details */}
        <div className="border rounded-lg p-6 bg-card mb-6">
          <div className="mb-6">
            <h2 className="text-sm font-medium text-muted-foreground mb-1">
              Order Number
            </h2>
            <p className="text-2xl font-bold">#{order.orderNumber}</p>
          </div>

          <Separator className="my-6" />

          {/* Order Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">Confirmation Email Sent</h3>
                  <p className="text-sm text-muted-foreground">
                    We&apos;ve sent a confirmation email to <strong>{order.billing.email}</strong>
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-100">
                  <Package className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">
                    {order.status === 'processing' ? 'Order Processing' : 'Order ' + order.status}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Your order is being prepared for shipment
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="border rounded-lg p-6 bg-card mb-6">
          <h2 className="text-xl font-bold mb-4">Order Items</h2>
          <div className="space-y-4">
            {order.lineItems.nodes.map((item) => (
              <div key={item.productId} className="flex gap-4">
                <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                  {item.product.node.image?.sourceUrl ? (
                    <Image
                      src={item.product.node.image.sourceUrl}
                      alt={item.product.node.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Package className="h-8 w-8 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.product.node.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Quantity: {item.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatPrice(item.total)}</p>
                  {item.quantity > 1 && (
                    <p className="text-sm text-muted-foreground">
                      {formatPrice(item.product.node.price || '0')} each
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          {/* Order Totals */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span className="font-medium">
                {parseFloat(order.shippingTotal) === 0 ? 'FREE' : formatPrice(order.shippingTotal)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span className="font-medium">{formatPrice(order.totalTax)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Shipping and Billing Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="border rounded-lg p-6 bg-card">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Shipping Address</h3>
            </div>
            <div className="text-sm space-y-1">
              <p>{order.shipping.firstName} {order.shipping.lastName}</p>
              <p>{order.shipping.address1}</p>
              {order.shipping.address2 && <p>{order.shipping.address2}</p>}
              <p>
                {order.shipping.city}, {order.shipping.state} {order.shipping.postcode}
              </p>
              <p>{order.shipping.country}</p>
            </div>
          </div>

          <div className="border rounded-lg p-6 bg-card">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Payment Method</h3>
            </div>
            <div className="text-sm space-y-1">
              <p className="font-medium">{order.paymentMethodTitle}</p>
              <div className="mt-3">
                <p className="text-muted-foreground">Billing Address:</p>
                <p>{order.billing.firstName} {order.billing.lastName}</p>
                <p>{order.billing.address1}</p>
                {order.billing.address2 && <p>{order.billing.address2}</p>}
                <p>
                  {order.billing.city}, {order.billing.state} {order.billing.postcode}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* What's Next */}
        <div className="border rounded-lg p-6 bg-card mb-6">
          <h2 className="text-xl font-bold mb-4">What happens next?</h2>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div>
                <h3 className="font-medium mb-1">Order Confirmation</h3>
                <p className="text-sm text-muted-foreground">
                  You&apos;ll receive an email confirmation with your order details.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div>
                <h3 className="font-medium mb-1">Processing (1-2 business days)</h3>
                <p className="text-sm text-muted-foreground">
                  We&apos;ll prepare your order and get it ready for shipment.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div>
                <h3 className="font-medium mb-1">Shipping (3-5 business days)</h3>
                <p className="text-sm text-muted-foreground">
                  Your order will be shipped and you&apos;ll receive a tracking number.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                4
              </div>
              <div>
                <h3 className="font-medium mb-1">Delivery</h3>
                <p className="text-sm text-muted-foreground">
                  Your order arrives at your doorstep. Enjoy!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Support */}
        <div className="bg-muted rounded-lg p-6 mb-8">
          <h2 className="text-lg font-bold mb-2">Need Help?</h2>
          <p className="text-sm text-muted-foreground mb-4">
            If you have any questions about your order, please don&apos;t hesitate to contact us.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild variant="outline">
              <Link href="/contact">Contact Support</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/faq">View FAQ</Link>
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild size="lg" className="flex-1">
            <Link href="/">
              <Home className="mr-2 h-5 w-5" />
              Back to Home
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="flex-1">
            <Link href="/products">
              <ShoppingBag className="mr-2 h-5 w-5" />
              Continue Shopping
            </Link>
          </Button>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Order confirmation and shipping updates will be sent to{' '}
            <strong>{order.billing.email}</strong>
          </p>
          <p className="mt-2">
            Please check your spam folder if you don&apos;t see the email within a few minutes.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  )
}

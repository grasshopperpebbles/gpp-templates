'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Package,
  ShoppingBag,
  ArrowLeft,
  Calendar,
  DollarSign,
  Eye
} from 'lucide-react'
import { getCustomerOrders, WooOrder } from '@/lib/auth-woocommerce'

export default function OrdersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<WooOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    loadOrders()
  }, [session, status, router])

  async function loadOrders() {
    if (!session?.customerId || !session?.authToken) {
      setIsLoading(false)
      return
    }

    try {
      const orderData = await getCustomerOrders(session.customerId, session.authToken)
      setOrders(orderData)
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  function getStatusColor(status: string) {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'refunded':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
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
            <span className="text-gray-600">Orders</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <Link href="/my-account" className="inline-flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Account
              </Link>
            </Button>
            
            <div>
              <h1 className="text-3xl font-bold">Your Orders</h1>
              <p className="text-muted-foreground mt-1">
                View and track your order history
              </p>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">No Orders Yet</h2>
                <p className="text-muted-foreground mb-6">
                  You haven&apos;t placed any orders yet. Start shopping to see your orders here.
                </p>
                <Button asChild>
                  <Link href="/">Start Shopping</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        Order #{order.orderNumber}
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(order.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {order.total}
                        </span>
                        <span className="flex items-center gap-1">
                          <Package className="h-4 w-4" />
                          {order.lineItems.nodes.length} item{order.lineItems.nodes.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {order.lineItems.nodes.slice(0, 3).map((item, index) => (
                      <div key={index} className="flex items-center gap-4">
                        {item.product.node.image?.sourceUrl && (
                          <div className="relative w-12 h-12 flex-shrink-0">
                            <Image
                              src={item.product.node.image.sourceUrl}
                              alt={item.product.node.name}
                              fill
                              className="object-cover rounded"
                              sizes="48px"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{item.product.node.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Qty: {item.quantity} • {item.total}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {order.lineItems.nodes.length > 3 && (
                      <p className="text-sm text-muted-foreground">
                        + {order.lineItems.nodes.length - 3} more item{order.lineItems.nodes.length - 3 !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
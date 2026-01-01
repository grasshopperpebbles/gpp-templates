'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  User,
  Package,
  Settings,
  ShoppingBag,
  CreditCard,
  MapPin,
  Heart,
  Clock,
  Bell
} from 'lucide-react'

export default function MyAccountPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (!session) {
      router.push('/login')
      return
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!session) {
    return null // Will redirect
  }

  const accountMenuItems = [
    {
      title: 'Orders',
      description: 'View your order history and track current orders',
      href: '/my-account/orders',
      icon: Package,
      color: 'text-blue-600'
    },
    {
      title: 'Account Details',
      description: 'Update your personal information and preferences',
      href: '/my-account/details',
      icon: User,
      color: 'text-green-600'
    },
    {
      title: 'Addresses',
      description: 'Manage your billing and shipping addresses',
      href: '/my-account/addresses',
      icon: MapPin,
      color: 'text-purple-600'
    },
    {
      title: 'Payment Methods',
      description: 'Add and manage your payment options',
      href: '/my-account/payment-methods',
      icon: CreditCard,
      color: 'text-orange-600'
    },
    {
      title: 'Wishlist',
      description: 'View and manage your saved products',
      href: '/my-account/wishlist',
      icon: Heart,
      color: 'text-red-600'
    },
    {
      title: 'Notifications',
      description: 'Manage price drop alerts and notification preferences',
      href: '/my-account/notifications',
      icon: Bell,
      color: 'text-yellow-600'
    },
    {
      title: 'Settings',
      description: 'Account preferences and notification settings',
      href: '/my-account/settings',
      icon: Settings,
      color: 'text-gray-600'
    }
  ]

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
            <span className="text-gray-600">My Account</span>
          </div>
          
          <h1 className="text-3xl font-bold">Welcome back, {session.user?.firstName || session.user?.name}!</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account and view your orders
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Recent Orders</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <Heart className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Wishlist Items</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-full">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Account Since</p>
                  <p className="text-lg font-semibold">New Member</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Account Menu */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accountMenuItems.map((item) => {
            const IconComponent = item.icon
            return (
              <Link key={item.href} href={item.href}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <IconComponent className={`h-6 w-6 ${item.color}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        <Separator className="my-8" />

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-muted-foreground">No recent activity</p>
              <p className="text-sm text-muted-foreground mt-2">
                Start shopping to see your order history here
              </p>
              <Button asChild className="mt-4">
                <Link href="/">Start Shopping</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
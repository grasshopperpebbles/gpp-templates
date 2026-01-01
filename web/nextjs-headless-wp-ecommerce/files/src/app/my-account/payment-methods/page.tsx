'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import {
  CreditCard,
  ShoppingBag,
  ArrowLeft,
  Plus,
  Trash2,
  Check,
  Loader2,
} from 'lucide-react'
import { StripeProvider } from '@/components/stripe-provider'
import { AddPaymentMethodForm } from '@/components/add-payment-method-form'
import type Stripe from 'stripe'

export default function PaymentMethodsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [paymentMethods, setPaymentMethods] = useState<Stripe.PaymentMethod[]>([])
  const [defaultPaymentMethodId, setDefaultPaymentMethodId] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [setupClientSecret, setSetupClientSecret] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    loadPaymentMethods()
  }, [session, status, router])

  const loadPaymentMethods = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/payment-methods')

      if (!response.ok) {
        throw new Error('Failed to load payment methods')
      }

      const data = await response.json()
      setPaymentMethods(data.paymentMethods || [])
      setDefaultPaymentMethodId(data.defaultPaymentMethodId)
    } catch (error) {
      console.error('Error loading payment methods:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddPaymentMethod = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/payment-methods', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to create setup intent')
      }

      const data = await response.json()
      setSetupClientSecret(data.clientSecret)
      setIsAddDialogOpen(true)
    } catch (error) {
      console.error('Error creating setup intent:', error)
      alert('Failed to initialize payment form. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeletePaymentMethod = (id: string) => {
    setDeleteConfirmId(id)
  }

  const confirmDelete = async () => {
    if (!deleteConfirmId) return

    setActionLoading(deleteConfirmId)
    try {
      const response = await fetch(`/api/payment-methods/${deleteConfirmId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete payment method')
      }

      await loadPaymentMethods()
      setDeleteConfirmId(null)
    } catch (error) {
      console.error('Error deleting payment method:', error)
      alert('Failed to delete payment method. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleSetDefault = async (id: string) => {
    setActionLoading(id)
    try {
      const response = await fetch(`/api/payment-methods/${id}/default`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to set default payment method')
      }

      setDefaultPaymentMethodId(id)
    } catch (error) {
      console.error('Error setting default payment method:', error)
      alert('Failed to set default payment method. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleAddSuccess = () => {
    setIsAddDialogOpen(false)
    setSetupClientSecret(null)
    loadPaymentMethods()
  }

  const handleAddCancel = () => {
    setIsAddDialogOpen(false)
    setSetupClientSecret(null)
  }

  const getCardBrand = (brand: string) => {
    const brands: Record<string, string> = {
      visa: '💳 Visa',
      mastercard: '💳 Mastercard',
      amex: '💳 American Express',
      discover: '💳 Discover',
      diners: '💳 Diners Club',
      jcb: '💳 JCB',
      unionpay: '💳 UnionPay',
    }
    return brands[brand.toLowerCase()] || '💳 Card'
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-900" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
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
            <span className="text-gray-600">Payment Methods</span>
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
                <h1 className="text-3xl font-bold">Payment Methods</h1>
                <p className="text-muted-foreground mt-1">
                  Securely manage your payment options
                </p>
              </div>
            </div>

            <Button onClick={handleAddPaymentMethod} className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Card
            </Button>
          </div>
        </div>

        {/* Payment Methods List */}
        <div className="space-y-4">
          {paymentMethods.length === 0 ? (
            <Card>
              <CardContent className="p-8">
                <div className="text-center">
                  <CreditCard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold mb-2">No Payment Methods</h2>
                  <p className="text-muted-foreground mb-6">
                    Add a payment method to speed up your checkout process.
                  </p>
                  <Button onClick={handleAddPaymentMethod} className="inline-flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Your First Card
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            paymentMethods.map((method) => {
              const isDefault = method.id === defaultPaymentMethodId
              const card = method.card

              if (!card) return null

              return (
                <Card key={method.id} className={isDefault ? 'border-primary' : ''}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-4">
                        <div className="text-4xl">{getCardBrand(card.brand).split(' ')[0]}</div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">
                              {card.brand.charAt(0).toUpperCase() + card.brand.slice(1)} •••• {card.last4}
                            </p>
                            {isDefault && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
                                <Check className="h-3 w-3" />
                                Default
                              </span>
                            )}
                          </div>
                          {method.billing_details?.name && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {method.billing_details.name}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            Expires {String(card.exp_month).padStart(2, '0')}/{card.exp_year}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!isDefault && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefault(method.id)}
                            disabled={actionLoading === method.id}
                          >
                            {actionLoading === method.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Set Default'
                            )}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePaymentMethod(method.id)}
                          disabled={actionLoading === method.id}
                        >
                          {actionLoading === method.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-red-500" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        {/* Security Notice */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm text-blue-900 mb-2">
              🔒 Your payment information is encrypted and secure. We use Stripe for payment processing and never store your full card number or CVV.
            </p>
            <p className="text-xs text-blue-700">
              <strong>PCI Compliant:</strong> All payment data is tokenized and stored securely with Stripe, meeting PCI DSS Level 1 certification standards.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add Payment Method Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
            <DialogDescription>
              Securely add a new credit or debit card
            </DialogDescription>
          </DialogHeader>
          {setupClientSecret && (
            <StripeProvider clientSecret={setupClientSecret}>
              <AddPaymentMethodForm
                clientSecret={setupClientSecret}
                onSuccess={handleAddSuccess}
                onCancel={handleAddCancel}
                isFirstCard={paymentMethods.length === 0}
              />
            </StripeProvider>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment Method?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payment method? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

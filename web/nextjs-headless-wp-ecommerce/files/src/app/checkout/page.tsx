'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCart } from '@/store/cart'
import { formatPrice } from '@/lib/utils'
import { getCustomer, type Address } from '@/lib/customer-api'
import { createWooCommerceOrder, type CreateOrderInput } from '@/lib/orders'
import {
  CreditCard,
  Lock,
  ArrowLeft,
  CheckCircle,
  MapPin,
  User,
  Plus,
} from 'lucide-react'

interface CheckoutFormData {
  // Billing Information
  firstName: string
  lastName: string
  email: string
  phone: string

  // Shipping Address
  address1: string
  address2: string
  city: string
  state: string
  postcode: string
  country: string

  // Payment (placeholder - will integrate with payment gateway)
  paymentMethod: 'card' | 'paypal'
}

export default function CheckoutPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const {
    items,
    getTotalPrice,
    clearCart,
    isLoading,
    discountTotal,
    appliedCoupons,
  } = useCart()

  const [formData, setFormData] = useState<CheckoutFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postcode: '',
    country: 'US',
    paymentMethod: 'card',
  })

  const [isProcessing, setIsProcessing] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutFormData, string>>>({})
  const [savedAddresses, setSavedAddresses] = useState<{ billing?: Address; shipping?: Address }>({})
  const [selectedBillingAddress, setSelectedBillingAddress] = useState<string>('new')
  const [selectedShippingAddress, setSelectedShippingAddress] = useState<string>('new')
  const [sameAsBilling, setSameAsBilling] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<{
    id: string
    card: {
      brand: string
      last4: string
      exp_month: number
      exp_year: number
    }
  }[]>([])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('')
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(true)

  // Tax and Shipping state
  const [tax, setTax] = useState(0)
  const [taxRate, setTaxRate] = useState(0)
  const [shipping, setShipping] = useState(0)
  const [shippingRates, setShippingRates] = useState<Array<{
    objectId: string
    provider: string
    servicelevel: { name: string; token: string }
    amount: string
    estimatedDays: number
    durationTerms: string
  }>>([])
  const [selectedShippingRate, setSelectedShippingRate] = useState<string>('')
  const [isCalculatingTaxShipping, setIsCalculatingTaxShipping] = useState(false)

  // Load saved addresses and payment methods if user is logged in
  useEffect(() => {
    const loadSavedData = async () => {
      if (status === 'authenticated' && session?.authToken && session?.customerId) {
        try {
          // Load addresses
          const customerData = await getCustomer(session.customerId, session.authToken)
          if (customerData) {
            setSavedAddresses({
              billing: customerData.billing,
              shipping: customerData.shipping,
            })

            // Pre-fill email and name from customer data
            if (customerData.email) {
              setFormData(prev => ({ ...prev, email: customerData.email }))
            }
            if (customerData.firstName || customerData.lastName) {
              setFormData(prev => ({
                ...prev,
                firstName: customerData.firstName || prev.firstName,
                lastName: customerData.lastName || prev.lastName,
              }))
            }
          }

          // Load payment methods
          const pmResponse = await fetch('/api/payment-methods')
          const pmData = await pmResponse.json()
          if (pmData.paymentMethods) {
            setPaymentMethods(pmData.paymentMethods)
            // Auto-select default payment method
            if (pmData.defaultPaymentMethodId) {
              setSelectedPaymentMethod(pmData.defaultPaymentMethodId)
            } else if (pmData.paymentMethods.length > 0) {
              setSelectedPaymentMethod(pmData.paymentMethods[0].id)
            }
          }
        } catch (error) {
          console.error('Error loading saved data:', error)
        } finally {
          setIsLoadingPaymentMethods(false)
        }
      } else {
        setIsLoadingPaymentMethods(false)
      }
    }

    loadSavedData()
  }, [status, session])

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0 && !isLoading) {
      router.push('/cart')
    }
  }, [items.length, isLoading, router])

  // Handle "Same as billing" checkbox
  useEffect(() => {
    if (sameAsBilling && selectedBillingAddress !== 'new') {
      setSelectedShippingAddress(selectedBillingAddress)
      // Copy billing address fields to shipping
      setFormData(prev => ({
        ...prev,
        address1: prev.address1,
        address2: prev.address2,
        city: prev.city,
        state: prev.state,
        postcode: prev.postcode,
      }))
    }
  }, [sameAsBilling, selectedBillingAddress])

  // Calculate tax and shipping when address is complete
  useEffect(() => {
    const calculateTaxAndShipping = async () => {
      // Check if address is complete
      if (
        !formData.address1 ||
        !formData.city ||
        !formData.state ||
        !formData.postcode ||
        !formData.firstName ||
        !formData.lastName
      ) {
        return
      }

      // Check if user is authenticated
      if (status !== 'authenticated') {
        return
      }

      setIsCalculatingTaxShipping(true)

      try {
        const subtotal = getTotalPrice()

        // Calculate tax
        const taxResponse = await fetch('/api/calculate-tax', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subtotal,
            shippingAddress: {
              line1: formData.address1,
              line2: formData.address2,
              city: formData.city,
              state: formData.state,
              postalCode: formData.postcode,
              country: formData.country,
            },
          }),
        })

        if (taxResponse.ok) {
          const taxData = await taxResponse.json()
          setTax(taxData.taxAmount)
          setTaxRate(taxData.taxRate)
        }

        // Calculate shipping rates
        const shippingResponse = await fetch('/api/calculate-shipping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toAddress: {
              name: `${formData.firstName} ${formData.lastName}`,
              street1: formData.address1,
              street2: formData.address2,
              city: formData.city,
              state: formData.state,
              zip: formData.postcode,
              country: formData.country,
            },
            totalWeight: items.reduce((sum, item) => sum + item.quantity * 0.5, 0), // Estimate 0.5 lbs per item
          }),
        })

        if (shippingResponse.ok) {
          const shippingData = await shippingResponse.json()
          if (shippingData.rates && shippingData.rates.length > 0) {
            setShippingRates(shippingData.rates)
            // Auto-select cheapest rate
            if (shippingData.cheapestRate) {
              setSelectedShippingRate(shippingData.cheapestRate.objectId)
              setShipping(parseFloat(shippingData.cheapestRate.amount))
            }
          }
        }
      } catch (error) {
        console.error('Error calculating tax and shipping:', error)
      } finally {
        setIsCalculatingTaxShipping(false)
      }
    }

    calculateTaxAndShipping()
  }, [
    formData.address1,
    formData.city,
    formData.state,
    formData.postcode,
    formData.firstName,
    formData.lastName,
    status,
    items,
    getTotalPrice,
  ])

  // Calculate totals
  const subtotal = getTotalPrice()
  const discount = parseFloat(discountTotal) || 0
  const total = Math.max(0, subtotal - discount + shipping + tax)

  const handleBillingAddressSelect = (value: string) => {
    setSelectedBillingAddress(value)

    if (value === 'billing' && savedAddresses.billing) {
      const addr = savedAddresses.billing
      setFormData(prev => ({
        ...prev,
        firstName: addr.firstName,
        lastName: addr.lastName,
        email: addr.email || prev.email,
        phone: addr.phone || prev.phone,
        address1: addr.address1,
        address2: addr.address2 || '',
        city: addr.city,
        state: addr.state,
        postcode: addr.postcode,
      }))
    } else if (value === 'new') {
      // Clear form for new address
      setFormData(prev => ({
        ...prev,
        address1: '',
        address2: '',
        city: '',
        state: '',
        postcode: '',
      }))
    }
  }

  const handleShippingAddressSelect = (value: string) => {
    setSelectedShippingAddress(value)

    if (value === 'billing' && savedAddresses.billing) {
      const addr = savedAddresses.billing
      setFormData(prev => ({
        ...prev,
        address1: addr.address1,
        address2: addr.address2 || '',
        city: addr.city,
        state: addr.state,
        postcode: addr.postcode,
      }))
    } else if (value === 'shipping' && savedAddresses.shipping) {
      const addr = savedAddresses.shipping
      setFormData(prev => ({
        ...prev,
        address1: addr.address1,
        address2: addr.address2 || '',
        city: addr.city,
        state: addr.state,
        postcode: addr.postcode,
      }))
    } else if (value === 'new') {
      // Only clear if not "same as billing"
      if (!sameAsBilling) {
        setFormData(prev => ({
          ...prev,
          address1: '',
          address2: '',
          city: '',
          state: '',
          postcode: '',
        }))
      }
    }
  }

  const handleInputChange = (field: keyof CheckoutFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CheckoutFormData, string>> = {}

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address'
    }
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required'
    if (!formData.address1.trim()) newErrors.address1 = 'Address is required'
    if (!formData.city.trim()) newErrors.city = 'City is required'
    if (!formData.state.trim()) newErrors.state = 'State is required'
    if (!formData.postcode.trim()) newErrors.postcode = 'Postal code is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    // Check if user is authenticated
    if (status !== 'authenticated' || !session?.authToken || !session?.customerId) {
      alert('Please log in to complete your order')
      router.push('/login')
      return
    }

    // Check if payment method is selected
    if (!selectedPaymentMethod && paymentMethods.length > 0) {
      alert('Please select a payment method')
      return
    }

    setIsProcessing(true)

    try {
      // Step 1: Create PaymentIntent with Stripe
      const paymentIntentResponse = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          paymentMethodId: selectedPaymentMethod,
        }),
      })

      const paymentIntentData = await paymentIntentResponse.json()

      if (!paymentIntentResponse.ok || !paymentIntentData.paymentIntent) {
        throw new Error('Failed to create payment intent')
      }

      const paymentIntent = paymentIntentData.paymentIntent

      // Check if payment requires confirmation (3D Secure, etc.)
      if (paymentIntent.status === 'requires_confirmation' || paymentIntent.status === 'requires_action') {
        throw new Error('Payment requires additional confirmation. Please use a different card.')
      }

      // Check if payment succeeded
      if (paymentIntent.status !== 'succeeded') {
        throw new Error('Payment failed. Please try again.')
      }

      // Step 2: Create order in WooCommerce
      const orderInput: CreateOrderInput = {
        customerId: session.customerId,
        status: 'processing',
        paymentMethod: 'stripe',
        paymentMethodTitle: 'Credit Card (Stripe)',
        setPaid: true,
        transactionId: paymentIntent.id,
        billing: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address1: formData.address1,
          address2: formData.address2,
          city: formData.city,
          state: formData.state,
          postcode: formData.postcode,
          country: formData.country,
        },
        shipping: sameAsBilling
          ? {
              firstName: formData.firstName,
              lastName: formData.lastName,
              address1: formData.address1,
              address2: formData.address2,
              city: formData.city,
              state: formData.state,
              postcode: formData.postcode,
              country: formData.country,
            }
          : {
              firstName: formData.firstName,
              lastName: formData.lastName,
              address1: formData.address1,
              address2: formData.address2,
              city: formData.city,
              state: formData.state,
              postcode: formData.postcode,
              country: formData.country,
            },
        lineItems: items.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          total: (parseFloat(item.price) * item.quantity).toFixed(2),
        })),
        shippingLines: [
          {
            methodId: selectedShippingRate || 'flat_rate',
            methodTitle: shippingRates.find(r => r.objectId === selectedShippingRate)
              ? `${shippingRates.find(r => r.objectId === selectedShippingRate)!.provider} - ${shippingRates.find(r => r.objectId === selectedShippingRate)!.servicelevel.name}`
              : (shipping === 0 ? 'Free Shipping' : 'Standard Shipping'),
            total: shipping.toFixed(2),
          },
        ],
        metaData: [
          {
            key: '_stripe_payment_intent_id',
            value: paymentIntent.id,
          },
        ],
      }

      const order = await createWooCommerceOrder(orderInput, session.authToken)

      if (!order) {
        throw new Error('Failed to create order')
      }

      // Step 3: Clear cart after successful order
      clearCart()

      // Step 4: Redirect to order confirmation page with real order ID
      router.push(`/order-confirmation?order=${order.databaseId}`)
    } catch (error) {
      console.error('Checkout error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Payment failed. Please try again.'
      alert(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  if (items.length === 0) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          href="/cart"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Cart
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold">Checkout</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Billing Information */}
            <div className="border rounded-lg p-6 bg-card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Billing Information</h2>
                {status === 'authenticated' && (
                  <Link
                    href="/my-account/addresses"
                    className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <MapPin className="h-4 w-4" />
                    Manage Addresses
                  </Link>
                )}
              </div>

              {/* Address Selection for Logged-in Users */}
              {status === 'authenticated' && (savedAddresses.billing || savedAddresses.shipping) && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <Label htmlFor="billing-address-select" className="text-sm font-medium mb-2 block">
                    Use Saved Address
                  </Label>
                  <Select value={selectedBillingAddress} onValueChange={handleBillingAddressSelect}>
                    <SelectTrigger id="billing-address-select" className="bg-white">
                      <SelectValue placeholder="Select an address" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">
                        <span className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Enter New Address
                        </span>
                      </SelectItem>
                      {savedAddresses.billing && (
                        <SelectItem value="billing">
                          <span className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Saved Billing Address
                          </span>
                          <span className="text-xs text-muted-foreground block ml-6">
                            {savedAddresses.billing.address1}, {savedAddresses.billing.city}
                          </span>
                        </SelectItem>
                      )}
                      {savedAddresses.shipping && (
                        <SelectItem value="shipping">
                          <span className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Saved Shipping Address
                          </span>
                          <span className="text-xs text-muted-foreground block ml-6">
                            {savedAddresses.shipping.address1}, {savedAddresses.shipping.city}
                          </span>
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={errors.firstName ? 'border-red-500' : ''}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="lastName">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={errors.lastName ? 'border-red-500' : ''}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone">
                    Phone <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="border rounded-lg p-6 bg-card">
              <h2 className="text-2xl font-bold mb-6">Shipping Address</h2>

              {/* Same as Billing Checkbox */}
              <div className="mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sameAsBilling}
                    onChange={(e) => {
                      setSameAsBilling(e.target.checked)
                      if (e.target.checked) {
                        setSelectedShippingAddress(selectedBillingAddress)
                      }
                    }}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="text-sm font-medium">Same as billing address</span>
                </label>
              </div>

              {/* Address Selection for Logged-in Users (only if not same as billing) */}
              {!sameAsBilling && status === 'authenticated' && (savedAddresses.billing || savedAddresses.shipping) && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <Label htmlFor="shipping-address-select" className="text-sm font-medium mb-2 block">
                    Use Saved Address
                  </Label>
                  <Select value={selectedShippingAddress} onValueChange={handleShippingAddressSelect}>
                    <SelectTrigger id="shipping-address-select" className="bg-white">
                      <SelectValue placeholder="Select an address" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">
                        <span className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Enter New Address
                        </span>
                      </SelectItem>
                      {savedAddresses.billing && (
                        <SelectItem value="billing">
                          <span className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Billing Address
                          </span>
                          <span className="text-xs text-muted-foreground block ml-6">
                            {savedAddresses.billing.address1}, {savedAddresses.billing.city}
                          </span>
                        </SelectItem>
                      )}
                      {savedAddresses.shipping && (
                        <SelectItem value="shipping">
                          <span className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Saved Shipping Address
                          </span>
                          <span className="text-xs text-muted-foreground block ml-6">
                            {savedAddresses.shipping.address1}, {savedAddresses.shipping.city}
                          </span>
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className={`space-y-4 ${sameAsBilling ? 'opacity-50 pointer-events-none' : ''}`}>
                <div>
                  <Label htmlFor="address1">
                    Address Line 1 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="address1"
                    value={formData.address1}
                    onChange={(e) => handleInputChange('address1', e.target.value)}
                    placeholder="Street address"
                    className={errors.address1 ? 'border-red-500' : ''}
                  />
                  {errors.address1 && (
                    <p className="text-sm text-red-500 mt-1">{errors.address1}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="address2">Address Line 2</Label>
                  <Input
                    id="address2"
                    value={formData.address2}
                    onChange={(e) => handleInputChange('address2', e.target.value)}
                    placeholder="Apartment, suite, etc. (optional)"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">
                      City <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className={errors.city ? 'border-red-500' : ''}
                    />
                    {errors.city && (
                      <p className="text-sm text-red-500 mt-1">{errors.city}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="state">
                      State <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="CA"
                      className={errors.state ? 'border-red-500' : ''}
                    />
                    {errors.state && (
                      <p className="text-sm text-red-500 mt-1">{errors.state}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="postcode">
                      Postal Code <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="postcode"
                      value={formData.postcode}
                      onChange={(e) => handleInputChange('postcode', e.target.value)}
                      className={errors.postcode ? 'border-red-500' : ''}
                    />
                    {errors.postcode && (
                      <p className="text-sm text-red-500 mt-1">{errors.postcode}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value="United States"
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Method */}
            <div className="border rounded-lg p-6 bg-card">
              <h2 className="text-2xl font-bold mb-6">Shipping Method</h2>

              {isCalculatingTaxShipping ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                  Calculating shipping rates...
                </div>
              ) : shippingRates.length > 0 ? (
                <div className="space-y-3">
                  {shippingRates.map((rate) => (
                    <div
                      key={rate.objectId}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedShippingRate === rate.objectId
                          ? 'border-primary bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                      onClick={() => {
                        setSelectedShippingRate(rate.objectId)
                        setShipping(parseFloat(rate.amount))
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shipping-method"
                          checked={selectedShippingRate === rate.objectId}
                          onChange={() => {
                            setSelectedShippingRate(rate.objectId)
                            setShipping(parseFloat(rate.amount))
                          }}
                          className="w-4 h-4 text-primary"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">
                              {rate.provider} - {rate.servicelevel.name}
                            </p>
                            <p className="font-bold">{formatPrice(rate.amount)}</p>
                          </div>
                          {rate.durationTerms && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {rate.durationTerms}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-muted-foreground">
                  Please enter a complete shipping address to see available shipping methods.
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="border rounded-lg p-6 bg-card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Payment Method</h2>
                {status === 'authenticated' && (
                  <Link
                    href="/my-account/payment-methods"
                    className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <CreditCard className="h-4 w-4" />
                    Manage Cards
                  </Link>
                )}
              </div>

              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-blue-50 border-blue-200 flex items-start gap-3">
                  <Lock className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-1">Secure Checkout</p>
                    <p>Your payment information is encrypted and secure.</p>
                  </div>
                </div>

                {status === 'authenticated' ? (
                  <>
                    {isLoadingPaymentMethods ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        Loading payment methods...
                      </div>
                    ) : paymentMethods.length > 0 ? (
                      <div className="space-y-3">
                        <Label htmlFor="payment-method-select" className="text-base font-medium">
                          Select Payment Method
                        </Label>
                        {paymentMethods.map((pm) => (
                          <div
                            key={pm.id}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                              selectedPaymentMethod === pm.id
                                ? 'border-primary bg-blue-50'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                            onClick={() => setSelectedPaymentMethod(pm.id)}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="payment-method"
                                checked={selectedPaymentMethod === pm.id}
                                onChange={() => setSelectedPaymentMethod(pm.id)}
                                className="w-4 h-4 text-primary"
                              />
                              <CreditCard className="h-5 w-5 text-muted-foreground" />
                              <div className="flex-1">
                                <p className="font-medium">
                                  {pm.card.brand.charAt(0).toUpperCase() + pm.card.brand.slice(1)} •••• {pm.card.last4}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Expires {pm.card.exp_month}/{pm.card.exp_year}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => router.push('/my-account/payment-methods')}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add New Card
                        </Button>
                      </div>
                    ) : (
                      <div className="p-4 border-2 rounded-lg bg-yellow-50 border-yellow-200">
                        <p className="text-sm text-yellow-900 mb-3">
                          No payment methods found. Please add a card to continue.
                        </p>
                        <Button
                          type="button"
                          variant="default"
                          size="sm"
                          onClick={() => router.push('/my-account/payment-methods')}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Payment Method
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-4 border-2 rounded-lg bg-yellow-50 border-yellow-200">
                    <p className="text-sm text-yellow-900">
                      Please log in to complete your purchase.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>Processing...</>
              ) : (
                <>
                  <Lock className="mr-2 h-5 w-5" />
                  Place Order - {formatPrice(total.toFixed(2))}
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="border rounded-lg p-6 sticky top-8 bg-card">
            <h2 className="text-2xl font-bold mb-6">Order Summary</h2>

            {/* Cart Items */}
            <div className="space-y-4 mb-6">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
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
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-2">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">
                      {formatPrice((parseFloat(item.price) * item.quantity).toFixed(2))}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-6" />

            {/* Totals */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatPrice(subtotal.toFixed(2))}</span>
              </div>

              {/* Applied Coupons & Discount */}
              {discount > 0 && (
                <div className="space-y-2">
                  {appliedCoupons.map((coupon) => (
                    <div key={coupon.code} className="flex justify-between text-sm text-green-600">
                      <span className="flex items-center gap-1">
                        <span>Coupon:</span>
                        <span className="font-mono uppercase">{coupon.code}</span>
                      </span>
                      <span className="font-medium">-{formatPrice(coupon.discountAmount)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium">
                  {isCalculatingTaxShipping ? (
                    <span className="text-xs">Calculating...</span>
                  ) : shipping === 0 ? (
                    <span className="text-green-600">FREE</span>
                  ) : (
                    formatPrice(shipping.toFixed(2))
                  )}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Tax {taxRate > 0 && <span className="text-xs">({taxRate.toFixed(2)}%)</span>}
                </span>
                <span className="font-medium">
                  {isCalculatingTaxShipping ? (
                    <span className="text-xs">Calculating...</span>
                  ) : (
                    formatPrice(tax.toFixed(2))
                  )}
                </span>
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatPrice(total.toFixed(2))}</span>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Trust Indicators */}
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Free shipping on orders over $50</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Secure checkout with SSL encryption</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>30-day money-back guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

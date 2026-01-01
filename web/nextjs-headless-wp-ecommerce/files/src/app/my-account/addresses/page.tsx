'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getCustomer, updateCustomerAddresses, type Address } from '@/lib/customer-api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  ShoppingBag,
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Home,
  Building
} from 'lucide-react'

// Address interface imported from customer-api

export default function AddressesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    type: 'billing' as 'billing' | 'shipping',
    firstName: '',
    lastName: '',
    company: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postcode: '',
    country: 'US',
    phone: ''
  })

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    // Load addresses from localStorage (mock data for demo)
    // In production, this would fetch from WooCommerce API
    loadAddresses()
  }, [session, status, router])

  const loadAddresses = async () => {
    if (!session?.authToken || !session?.customerId) return

    try {
      const customerData = await getCustomer(session.customerId, session.authToken)

      if (customerData) {
        const addressList: Address[] = []

        // Add billing address if exists
        if (customerData.billing) {
          addressList.push({
            ...customerData.billing,
            email: customerData.billing.email || customerData.email
          })
        }

        // Add shipping address if exists
        if (customerData.shipping) {
          addressList.push(customerData.shipping)
        }

        setAddresses(addressList)
      }
    } catch (error) {
      console.error('Error loading addresses:', error)
      // Fallback to empty array on error
      setAddresses([])
    }
  }

  const saveAddresses = async (newAddresses: Address[]) => {
    if (!session?.authToken || !session?.customerId) return false

    setAddresses(newAddresses)

    try {
      // Find billing and shipping addresses
      const billing = newAddresses.find(addr => addr.type === 'billing')
      const shipping = newAddresses.find(addr => addr.type === 'shipping')

      // Update customer addresses in WooCommerce
      const success = await updateCustomerAddresses(
        session.customerId.toString(),
        { billing, shipping },
        session.authToken
      )

      if (!success) {
        console.error('Failed to save addresses to WooCommerce')
        return false
      }

      return true
    } catch (error) {
      console.error('Error saving addresses:', error)
      return false
    }
  }

  const handleAddAddress = () => {
    setFormData({
      type: 'billing',
      firstName: '',
      lastName: '',
      company: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      postcode: '',
      country: 'US',
      phone: ''
    })
    setIsAddDialogOpen(true)
  }

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address)
    setFormData({
      type: address.type,
      firstName: address.firstName,
      lastName: address.lastName,
      company: address.company || '',
      address1: address.address1,
      address2: address.address2 || '',
      city: address.city,
      state: address.state,
      postcode: address.postcode,
      country: address.country,
      phone: address.phone || ''
    })
    setIsEditDialogOpen(true)
  }

  const handleDeleteAddress = (id: string) => {
    setDeleteConfirmId(id)
  }

  const confirmDelete = async () => {
    if (deleteConfirmId) {
      const newAddresses = addresses.filter(addr => addr.id !== deleteConfirmId)
      const success = await saveAddresses(newAddresses)

      if (success) {
        setDeleteConfirmId(null)
      } else {
        alert('Failed to delete address. Please try again.')
        setDeleteConfirmId(null)
      }
    }
  }

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const newAddress: Address = {
      id: `${formData.type}-1`,
      type: formData.type,
      firstName: formData.firstName,
      lastName: formData.lastName,
      company: formData.company,
      address1: formData.address1,
      address2: formData.address2,
      city: formData.city,
      state: formData.state,
      postcode: formData.postcode,
      country: formData.country,
      phone: formData.phone,
      email: formData.type === 'billing' ? session?.user?.email : undefined
    }

    // Replace existing address of same type or add new
    const newAddresses = [
      ...addresses.filter(addr => addr.type !== formData.type),
      newAddress
    ]

    const success = await saveAddresses(newAddresses)

    setIsLoading(false)

    if (success) {
      setIsAddDialogOpen(false)
    } else {
      alert('Failed to save address. Please try again.')
    }
  }

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAddress) return

    setIsLoading(true)

    const updatedAddress: Address = {
      ...editingAddress,
      firstName: formData.firstName,
      lastName: formData.lastName,
      company: formData.company,
      address1: formData.address1,
      address2: formData.address2,
      city: formData.city,
      state: formData.state,
      postcode: formData.postcode,
      country: formData.country,
      phone: formData.phone
    }

    const newAddresses = addresses.map(addr =>
      addr.id === editingAddress.id ? updatedAddress : addr
    )

    const success = await saveAddresses(newAddresses)

    setIsLoading(false)

    if (success) {
      setIsEditDialogOpen(false)
      setEditingAddress(null)
    } else {
      alert('Failed to update address. Please try again.')
    }
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

  const billingAddresses = addresses.filter(addr => addr.type === 'billing')
  const shippingAddresses = addresses.filter(addr => addr.type === 'shipping')

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
            <span className="text-gray-600">Addresses</span>
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
                <h1 className="text-3xl font-bold">Your Addresses</h1>
                <p className="text-muted-foreground mt-1">
                  Manage your billing and shipping addresses
                </p>
              </div>
            </div>

            <Button onClick={handleAddAddress} className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Address
            </Button>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Billing Addresses */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Building className="h-5 w-5" />
              Billing Addresses
            </h2>
            <div className="space-y-4">
              {billingAddresses.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    No billing addresses saved
                  </CardContent>
                </Card>
              ) : (
                billingAddresses.map(address => (
                  <Card key={address.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="font-semibold">
                            {address.firstName} {address.lastName}
                          </p>
                          {address.company && (
                            <p className="text-sm text-muted-foreground">{address.company}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditAddress(address)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAddress(address.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm space-y-1 text-muted-foreground">
                        <p>{address.address1}</p>
                        {address.address2 && <p>{address.address2}</p>}
                        <p>
                          {address.city}, {address.state} {address.postcode}
                        </p>
                        <p>{address.country}</p>
                        {address.phone && <p>Phone: {address.phone}</p>}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Shipping Addresses */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Home className="h-5 w-5" />
              Shipping Addresses
            </h2>
            <div className="space-y-4">
              {shippingAddresses.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    No shipping addresses saved
                  </CardContent>
                </Card>
              ) : (
                shippingAddresses.map(address => (
                  <Card key={address.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="font-semibold">
                            {address.firstName} {address.lastName}
                          </p>
                          {address.company && (
                            <p className="text-sm text-muted-foreground">{address.company}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditAddress(address)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAddress(address.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm space-y-1 text-muted-foreground">
                        <p>{address.address1}</p>
                        {address.address2 && <p>{address.address2}</p>}
                        <p>
                          {address.city}, {address.state} {address.postcode}
                        </p>
                        <p>{address.country}</p>
                        {address.phone && <p>Phone: {address.phone}</p>}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Address Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Address</DialogTitle>
            <DialogDescription>
              Fill in the details for your new address
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitAdd} className="space-y-4">
            <div>
              <Label>Address Type</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="billing"
                    checked={formData.type === 'billing'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'billing' | 'shipping' })}
                  />
                  Billing
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="shipping"
                    checked={formData.type === 'shipping'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'billing' | 'shipping' })}
                  />
                  Shipping
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="address1">Address Line 1 *</Label>
              <Input
                id="address1"
                required
                value={formData.address1}
                onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="address2">Address Line 2</Label>
              <Input
                id="address2"
                value={formData.address2}
                onChange={(e) => setFormData({ ...formData, address2: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  required
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="postcode">Postcode *</Label>
                <Input
                  id="postcode"
                  required
                  value={formData.postcode}
                  onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  required
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Address'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Address Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Address</DialogTitle>
            <DialogDescription>
              Update your address details
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-firstName">First Name *</Label>
                <Input
                  id="edit-firstName"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-lastName">Last Name *</Label>
                <Input
                  id="edit-lastName"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-company">Company</Label>
              <Input
                id="edit-company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="edit-address1">Address Line 1 *</Label>
              <Input
                id="edit-address1"
                required
                value={formData.address1}
                onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="edit-address2">Address Line 2</Label>
              <Input
                id="edit-address2"
                value={formData.address2}
                onChange={(e) => setFormData({ ...formData, address2: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-city">City *</Label>
                <Input
                  id="edit-city"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-state">State *</Label>
                <Input
                  id="edit-state"
                  required
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-postcode">Postcode *</Label>
                <Input
                  id="edit-postcode"
                  required
                  value={formData.postcode}
                  onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-country">Country *</Label>
                <Input
                  id="edit-country"
                  required
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Update Address'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Address?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this address? This action cannot be undone.
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

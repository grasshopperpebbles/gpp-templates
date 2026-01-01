'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  ShoppingBag, 
  ArrowLeft,
  Save,
  CheckCircle
} from 'lucide-react'
import { updateCustomer } from '@/lib/auth-woocommerce'

const accountDetailsSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
})

type AccountDetailsForm = z.infer<typeof accountDetailsSchema>

export default function AccountDetailsPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const form = useForm<AccountDetailsForm>({
    resolver: zodResolver(accountDetailsSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: ''
    }
  })

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    // Populate form with current user data
    form.setValue('firstName', session.user?.firstName || '')
    form.setValue('lastName', session.user?.lastName || '')
    form.setValue('email', session.user?.email || '')
  }, [session, status, router, form])

  async function onSubmit(data: AccountDetailsForm) {
    if (!session?.user?.id || !session?.authToken) {
      setError('Unable to update account. Please try logging in again.')
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const updatedCustomer = await updateCustomer(
        session.user.id,
        {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email
        },
        session.authToken
      )

      if (updatedCustomer) {
        // Update the session with new data
        await update({
          ...session,
          user: {
            ...session.user,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            name: `${data.firstName} ${data.lastName}`.trim()
          }
        })

        setSuccess('Account details updated successfully!')
        
        setTimeout(() => setSuccess(null), 5000)
      }
    } catch (error: unknown) {
      console.error('Error updating account:', error)

      if (error instanceof Error && error.message?.includes('email')) {
        setError('This email address is already in use by another account.')
      } else {
        setError('Failed to update account details. Please try again.')
      }
    } finally {
      setIsLoading(false)
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
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
            <span className="text-gray-600">Account Details</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <Link href="/my-account" className="inline-flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Account
              </Link>
            </Button>
            
            <div>
              <h1 className="text-3xl font-bold">Account Details</h1>
              <p className="text-muted-foreground mt-1">
                Update your personal information
              </p>
            </div>
          </div>
        </div>

        {/* Account Details Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    {...form.register('firstName')}
                    disabled={isLoading}
                    className="mt-1"
                  />
                  {form.formState.errors.firstName && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.firstName.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    {...form.register('lastName')}
                    disabled={isLoading}
                    className="mt-1"
                  />
                  {form.formState.errors.lastName && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register('email')}
                  disabled={isLoading}
                  className="mt-1"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.email.message}
                  </p>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  This is also your username for logging in.
                </p>
              </div>

              <Separator />

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                  disabled={isLoading}
                >
                  Reset Changes
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    'Saving...'
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">Change Password</h3>
                <p className="text-sm text-muted-foreground">
                  Update your account password for security
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/forgot-password">Change Password</Link>
              </Button>
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">Account Privacy</h3>
                <p className="text-sm text-muted-foreground">
                  Manage your data and privacy settings
                </p>
              </div>
              <Button variant="outline" disabled>
                Privacy Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
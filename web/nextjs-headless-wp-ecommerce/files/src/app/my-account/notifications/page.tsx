'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Bell, Mail, Smartphone, Save } from 'lucide-react'

interface NotificationPreferences {
  priceDropNotificationsEnabled: boolean
  emailNotifications: boolean
  inAppNotifications: boolean
}

export default function NotificationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    priceDropNotificationsEnabled: true,
    emailNotifications: true,
    inAppNotifications: true,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadPreferences = useCallback(async () => {
    if (!session?.authToken || !session?.customerId) {
      return
    }

    try {
      setIsLoading(true)

      // Fetch user preferences from WooCommerce user meta
      const response = await fetch(process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:8080/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.authToken}`,
        },
        body: JSON.stringify({
          query: `
            query GetNotificationPreferences($customerId: Int!) {
              customer(customerId: $customerId) {
                id
                metaData(key: "notification_preferences") {
                  key
                  value
                }
              }
            }
          `,
          variables: { customerId: session.customerId },
        }),
      })

      const result = await response.json()

      if (result.data?.customer?.metaData) {
        const metaData = result.data.customer.metaData
        if (metaData && metaData.value) {
          const savedPreferences = JSON.parse(metaData.value)
          setPreferences(savedPreferences)
        }
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error)
    } finally {
      setIsLoading(false)
    }
  }, [session?.authToken, session?.customerId])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated') {
      loadPreferences()
    }
  }, [status, router, loadPreferences])

  const handleSave = async () => {
    if (!session?.authToken || !session?.customerId) {
      return
    }

    setIsSaving(true)
    setSaveMessage(null)

    try {
      // Save preferences to WooCommerce user meta
      const response = await fetch(process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:8080/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.authToken}`,
        },
        body: JSON.stringify({
          query: `
            mutation UpdateNotificationPreferences($id: ID!, $metaData: [MetaDataInput!]) {
              updateCustomer(input: {
                id: $id
                metaData: $metaData
              }) {
                customer {
                  id
                }
              }
            }
          `,
          variables: {
            id: btoa(`Customer:${session.customerId}`),
            metaData: [
              {
                key: 'notification_preferences',
                value: JSON.stringify(preferences),
              },
            ],
          },
        }),
      })

      const result = await response.json()

      if (result.errors) {
        console.error('GraphQL error:', result.errors)
        setSaveMessage('Failed to save preferences. Please try again.')
      } else {
        setSaveMessage('Preferences saved successfully!')
        setTimeout(() => setSaveMessage(null), 3000)
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
      setSaveMessage('Failed to save preferences. Please try again.')
    } finally {
      setIsSaving(false)
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" asChild>
              <Link href="/my-account" className="inline-flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Account
              </Link>
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Notification Preferences</h1>
              <p className="text-muted-foreground mt-1">
                Control how you receive notifications about price drops
              </p>
            </div>

            <Button onClick={handleSave} disabled={isSaving} className="inline-flex items-center gap-2">
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>

          {saveMessage && (
            <div
              className={`mt-4 p-4 rounded-lg ${
                saveMessage.includes('success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}
            >
              {saveMessage}
            </div>
          )}
        </div>

        {/* Price Drop Notifications */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Price Drop Notifications
            </CardTitle>
            <CardDescription>
              Get notified when items in your wishlist drop in price
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="price-drop-enabled" className="text-base font-medium">
                  Enable Price Drop Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive alerts when wishlist items go on sale
                </p>
              </div>
              <Switch
                id="price-drop-enabled"
                checked={preferences.priceDropNotificationsEnabled}
                onCheckedChange={(checked) =>
                  setPreferences((prev) => ({ ...prev, priceDropNotificationsEnabled: checked }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Channels */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Channels</CardTitle>
            <CardDescription>
              Choose how you want to receive price drop notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email Notifications */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="email-notifications" className="text-base font-medium">
                    Email Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive price drop alerts via email
                  </p>
                </div>
              </div>
              <Switch
                id="email-notifications"
                checked={preferences.emailNotifications}
                onCheckedChange={(checked) =>
                  setPreferences((prev) => ({ ...prev, emailNotifications: checked }))
                }
                disabled={!preferences.priceDropNotificationsEnabled}
              />
            </div>

            {/* In-App Notifications */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="inapp-notifications" className="text-base font-medium">
                    In-App Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Show alerts when you visit the site
                  </p>
                </div>
              </div>
              <Switch
                id="inapp-notifications"
                checked={preferences.inAppNotifications}
                onCheckedChange={(checked) =>
                  setPreferences((prev) => ({ ...prev, inAppNotifications: checked }))
                }
                disabled={!preferences.priceDropNotificationsEnabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* Info Notice */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> Price checks are performed automatically based on admin settings. You&apos;ll
              receive notifications according to your preferences when prices drop by the configured percentage.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle } from 'lucide-react'

interface AddPaymentMethodFormProps {
  clientSecret: string
  onSuccess: () => void
  onCancel: () => void
  isFirstCard: boolean
}

export function AddPaymentMethodForm({
  clientSecret,
  onSuccess,
  onCancel,
  isFirstCard,
}: AddPaymentMethodFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [cardholderName, setCardholderName] = useState('')
  const [setAsDefault, setSetAsDefault] = useState(isFirstCard)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsLoading(true)
    setError(null)

    const cardElement = elements.getElement(CardElement)

    if (!cardElement) {
      setError('Card element not found')
      setIsLoading(false)
      return
    }

    try {
      // Confirm the SetupIntent with the card details
      const { error: setupError, setupIntent } = await stripe.confirmCardSetup(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: cardholderName,
            },
          },
        }
      )

      if (setupError) {
        setError(setupError.message || 'An error occurred')
        setIsLoading(false)
        return
      }

      // If user wants this as default, call the API
      if (setAsDefault && setupIntent?.payment_method) {
        const paymentMethodId =
          typeof setupIntent.payment_method === 'string'
            ? setupIntent.payment_method
            : setupIntent.payment_method.id

        await fetch(`/api/payment-methods/${paymentMethodId}/default`, {
          method: 'POST',
        })
      }

      setSuccess(true)
      setTimeout(() => {
        onSuccess()
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Payment method added successfully!
          </AlertDescription>
        </Alert>
      )}

      <div>
        <Label htmlFor="cardholderName">
          Cardholder Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="cardholderName"
          required
          placeholder="John Doe"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          disabled={isLoading || success}
        />
      </div>

      <div>
        <Label>
          Card Details <span className="text-red-500">*</span>
        </Label>
        <div className="mt-1 p-3 border rounded-md bg-white">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#1f2937',
                  '::placeholder': {
                    color: '#9ca3af',
                  },
                },
                invalid: {
                  color: '#ef4444',
                },
              },
              disabled: isLoading || success,
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Your card details are encrypted and secure. We never store your full card number.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="setAsDefault"
          checked={setAsDefault}
          onChange={(e) => setSetAsDefault(e.target.checked)}
          disabled={isLoading || success}
          className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
        />
        <Label htmlFor="setAsDefault" className="cursor-pointer">
          Set as default payment method
        </Label>
      </div>

      <div className="flex gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading || success}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={!stripe || isLoading || success} className="flex-1">
          {isLoading ? 'Saving...' : success ? 'Saved!' : 'Save Card'}
        </Button>
      </div>
    </form>
  )
}

'use client'

import { Elements } from '@stripe/react-stripe-js'
import { getStripe } from '@/lib/stripe'
import { ReactNode } from 'react'

interface StripeProviderProps {
  children: ReactNode
  clientSecret?: string
}

/**
 * Stripe Elements Provider
 * Wraps components that need access to Stripe Elements
 */
export function StripeProvider({ children, clientSecret }: StripeProviderProps) {
  const stripePromise = getStripe()

  const options = clientSecret
    ? {
        clientSecret,
        appearance: {
          theme: 'stripe' as const,
          variables: {
            colorPrimary: '#0F172A',
            colorBackground: '#ffffff',
            colorText: '#1f2937',
            colorDanger: '#ef4444',
            fontFamily: 'system-ui, sans-serif',
            borderRadius: '8px',
          },
        },
      }
    : undefined

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  )
}

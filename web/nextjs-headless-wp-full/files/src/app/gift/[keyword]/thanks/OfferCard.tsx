'use client'

import { useState } from 'react'
import { ALREADY_BOUGHT, formatPrice } from '@/lib/broadkast-gifts'

export function OfferCard({
  keyword,
  s,
  offer,
}: {
  keyword: string
  s: string
  offer: {
    pitchLine: string
    productName: string
    priceMinor: number
    currency: string
    bought: boolean
    refundDays: number
  }
}) {
  const [waiting, setWaiting] = useState(false)
  const [error, setError] = useState('')

  async function onBuy() {
    setWaiting(true)
    setError('')
    try {
      const res = await fetch('/api/gift/thanks/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, s }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.ok && typeof data.url === 'string') {
        window.location.assign(data.url)
        return
      }
      setError(data.message || 'Something went wrong. Please try again.')
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setWaiting(false)
  }

  return (
    <section id="offer" className="mt-10 max-w-md rounded-md border border-border p-6">
      <p className="text-sm text-muted-foreground">{offer.pitchLine}</p>
      <h2 className="mt-1 text-2xl font-semibold">{offer.productName}</h2>
      <p className="mt-1 text-lg">{formatPrice(offer.priceMinor, offer.currency)}</p>
      {offer.bought ? (
        <p role="status" className="mt-4">
          {ALREADY_BOUGHT}
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={onBuy}
            disabled={waiting}
            className="h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            Buy
          </button>
        </div>
      )}
      <p className="mt-3 text-sm text-muted-foreground">Refunds within {offer.refundDays} days of purchase.</p>
    </section>
  )
}

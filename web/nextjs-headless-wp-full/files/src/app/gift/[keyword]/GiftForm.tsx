'use client'

import { useState } from 'react'

export function GiftForm({
  keyword,
  giftName,
  attributionToken,
}: {
  keyword: string
  giftName: string
  attributionToken?: string
}) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState('sending')
    try {
      const res = await fetch('/api/gift/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, keyword, attributionToken }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.ok) {
        setState('done')
      } else {
        setError(data.message || 'Something went wrong. Please try again.')
        setState('error')
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setState('error')
    }
  }

  if (state === 'done') {
    return (
      <p role="status" className="text-lg font-medium">
        Check your email. Your {giftName} is in it.
      </p>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-md flex-col gap-3">
      <label htmlFor="gift-email" className="text-sm font-medium">
        Your email
      </label>
      <input
        id="gift-email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="h-11 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
      />
      {state === 'error' && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={state === 'sending'}
        className="h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        Send it to me
      </button>
    </form>
  )
}

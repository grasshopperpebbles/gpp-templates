'use client'

import { useState } from 'react'

export function FreshLinkButton({ purchaseId }: { purchaseId: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')

  async function onClick() {
    setState('sending')
    try {
      const res = await fetch('/api/gift/download-resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseId }),
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

  return (
    <div className="mb-8 flex max-w-md flex-col gap-3">
      <p className="font-medium">That download link has expired.</p>
      {state === 'done' ? (
        <p role="status">If this purchase is still active, a fresh link is on its way to your email.</p>
      ) : (
        <>
          {state === 'error' && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={onClick}
            disabled={state === 'sending'}
            className="h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            Email me a fresh link
          </button>
        </>
      )}
    </div>
  )
}

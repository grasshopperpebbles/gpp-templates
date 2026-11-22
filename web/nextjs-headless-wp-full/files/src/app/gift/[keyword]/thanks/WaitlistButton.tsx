'use client'

import { useState } from 'react'

export function WaitlistButton({
  keyword,
  s,
  waitlist,
}: {
  keyword: string
  s: string
  waitlist: { kitName: string; kitDescription: string; joined: boolean }
}) {
  const [joined, setJoined] = useState(waitlist.joined)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  async function onClick() {
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/gift/thanks/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, s }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.ok) {
        setJoined(true)
      } else {
        setError(data.message || 'Something went wrong. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setSending(false)
  }

  return (
    <section className="mt-10 max-w-md">
      <h2 className="text-2xl font-semibold">{waitlist.kitName}</h2>
      <p className="mt-1 text-muted-foreground">{waitlist.kitDescription}</p>
      {joined ? (
        <p role="status" className="mt-4">
          You&apos;re on the list.
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
            onClick={onClick}
            disabled={sending}
            className="h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            Tell me when the kit is ready
          </button>
        </div>
      )}
    </section>
  )
}

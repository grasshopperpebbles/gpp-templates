'use client'

import { useState } from 'react'

export function SurveyForm({ keyword, s, questions }: { keyword: string; s: string; questions: string[] }) {
  const [values, setValues] = useState<string[]>(() => questions.map(() => ''))
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const answers = questions
      .map((question, i) => ({ question, answer: values[i].trim() }))
      .filter((a) => a.answer)
    if (answers.length === 0) {
      setError('Write an answer first.')
      setState('error')
      return
    }
    setState('sending')
    try {
      const res = await fetch('/api/gift/thanks/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, s, answers }),
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
      <p role="status" className="mt-10">
        Thanks. Your answers are saved.
      </p>
    )
  }

  return (
    <form onSubmit={onSubmit} className="mt-10 flex max-w-md flex-col gap-3">
      {questions.map((question, i) => (
        <div key={question} className="flex flex-col gap-1">
          <label htmlFor={`survey-${i}`} className="text-sm font-medium">
            {question}
          </label>
          <textarea
            id={`survey-${i}`}
            rows={3}
            value={values[i]}
            onChange={(e) => setValues((v) => v.map((x, j) => (j === i ? e.target.value : x)))}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
      ))}
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
        Send
      </button>
    </form>
  )
}

import type { Metadata } from 'next'
import { headers } from 'next/headers'
import {
  THANKS_EXPIRED,
  THANKS_UNAVAILABLE,
  clientIpOf,
  decodeKeyword,
  fetchThanks,
  readThanksParams,
  unansweredQuestions,
} from '@/lib/broadkast-gifts'
import { FreshLinkButton } from './FreshLinkButton'
import { OfferCard } from './OfferCard'
import { SurveyForm } from './SurveyForm'
import { WaitlistButton } from './WaitlistButton'

export const dynamic = 'force-dynamic'

// The token in the URL must not travel in a Referer to the gift host or Stripe.
export const metadata: Metadata = {
  title: 'Thank you',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

export default async function ThanksPage({
  params,
  searchParams,
}: {
  params: Promise<{ keyword: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { keyword: rawKeyword } = await params
  const keyword = decodeKeyword(rawKeyword)
  const { s, purchaseDone, downloadExpired, purchaseId } = readThanksParams(await searchParams)
  const result = await fetchThanks(keyword, s, clientIpOf(await headers()))

  if (result.kind !== 'ok') {
    return (
      <div className="container mx-auto px-4 py-16">
        <p role="alert">{result.kind === 'invalid' ? THANKS_EXPIRED : THANKS_UNAVAILABLE}</p>
      </div>
    )
  }

  const { view } = result
  const questions = unansweredQuestions(view.survey)

  return (
    <div className="container mx-auto px-4 py-16">
      {downloadExpired && purchaseId && <FreshLinkButton purchaseId={purchaseId} />}
      <h1 className="text-4xl font-bold">{view.gift.name}</h1>
      <a
        href={view.gift.downloadUrl}
        rel="noreferrer"
        className="mt-6 inline-flex h-11 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
      >
        Download your gift
      </a>
      {purchaseDone ? (
        <p role="status" className="mt-10">
          Your guide is on its way to your email.
        </p>
      ) : (
        view.offer?.canBuy && <OfferCard keyword={keyword} s={s} offer={view.offer} />
      )}
      {view.survey.length > 0 &&
        (questions.length === 0 ? (
          <p className="mt-10">Thanks. Your answers are saved.</p>
        ) : (
          <SurveyForm keyword={keyword} s={s} questions={questions} />
        ))}
      {view.waitlist && <WaitlistButton keyword={keyword} s={s} waitlist={view.waitlist} />}
    </div>
  )
}

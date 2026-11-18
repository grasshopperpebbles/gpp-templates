import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { decodeKeyword, fetchGift } from '@/lib/broadkast-gifts'
import { GiftForm } from './GiftForm'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Free gift',
  robots: { index: false, follow: false },
}

export default async function GiftPage({
  params,
  searchParams,
}: {
  params: Promise<{ keyword: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { keyword: rawKeyword } = await params
  const sp = await searchParams
  const keyword = decodeKeyword(rawKeyword)
  const gift = await fetchGift(keyword)

  // The segment's not-found.tsx carries "This gift isn't available." and sends HTTP 404.
  if (!gift) notFound()

  const token = Array.isArray(sp.ea_token) ? sp.ea_token[0] : sp.ea_token
  const expired = sp.status === 'expired'

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold">Free {gift.name}</h1>
      <p className="mt-2 text-lg text-muted-foreground">For {gift.audience}</p>
      {expired && (
        <p role="alert" className="mt-6">
          That link expired. Enter your email again.
        </p>
      )}
      <div className="mt-8">
        <GiftForm keyword={keyword} giftName={gift.name} attributionToken={token} />
      </div>
    </div>
  )
}

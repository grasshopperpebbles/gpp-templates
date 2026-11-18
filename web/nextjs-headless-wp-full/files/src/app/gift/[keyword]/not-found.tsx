import Link from 'next/link'

export default function GiftNotFound() {
  return (
    <div className="container mx-auto px-4 py-16">
      <p className="text-lg">This gift isn&apos;t available.</p>
      <p className="mt-4">
        <Link href="/" className="underline">
          Go to the home page
        </Link>
      </p>
    </div>
  )
}

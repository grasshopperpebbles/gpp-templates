import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { graphqlClient, GET_PAGE_BY_SLUG, type PageResponse } from '@/lib/graphql'

export default async function TermsPage() {
  const data = await graphqlClient.query<PageResponse>(GET_PAGE_BY_SLUG, {
    slug: 'terms'
  })

  const page = data.page

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">{page.title}</span>
      </div>

      {/* Page Content */}
      <article className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-8">{page.title}</h1>

        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </article>
    </div>
  )
}

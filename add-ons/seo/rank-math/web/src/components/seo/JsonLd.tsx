// gpp:seo-rank-math
// Renders a post's JSON-LD (Rank Math schema, URLs on this site). Added by `gpp add seo rank-math`.
import { rankMathJsonLd, serializeJsonLd, type SeoPostInput, type SeoSite } from '@/lib/seo/rank-math'

export function PostJsonLd({ post, site }: { post: SeoPostInput; site?: SeoSite }) {
  const blocks = rankMathJsonLd(post, site)
  if (blocks.length === 0) return null
  return (
    <>
      {blocks.map((block, i) => (
        <script
          // biome-ignore lint/suspicious/noArrayIndexKey: blocks have no stable id and never reorder
          key={i}
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: serializeJsonLd escapes `<`
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(block) }}
        />
      ))}
    </>
  )
}

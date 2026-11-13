# Rank Math SEO (headless)

<!-- gpp:seo-rank-math -->
Added by `gpp add seo rank-math`. Run it again at any time. It only creates missing files, and it reports a file you have changed instead of replacing it.

## What it sets up

**WordPress** (in the CMS app):

- `wp-content/plugins/rest-meta-for-rank-math/`: exposes Rank Math's per-post fields in the core REST API.
- `scripts/seo-rank-math-setup.sh`: installs and activates WPGraphQL, Rank Math SEO, WPGraphQL for Rank Math (0.3.4 from GitHub) and REST Meta for Rank Math. It turns on Rank Math's headless support, makes Article the default schema for posts, and turns off Rank Math's sitemap. `gpp add seo` runs the script when the WordPress container is running. Otherwise, run it yourself:

  ```bash
  docker compose up -d
  docker compose exec -T <wordpress-service> bash -c "$(cat scripts/seo-rank-math-setup.sh)"
  ```

**Next.js** (in the web app):

- `lib/seo/rank-math.ts`: the GraphQL fields, `rankMathMetadata()` (title, description, canonical, robots, Open Graph, X card) and `rankMathJsonLd()`. Empty fields fall back to the post title and excerpt. URLs on the WordPress domain are rewritten to `NEXT_PUBLIC_SITE_URL`, except media under `/wp-content/`.
- `components/seo/JsonLd.tsx`: `<PostJsonLd post={post} />`.
- `app/sitemap.ts` and `app/robots.ts`, unless the app already has a sitemap or robots file.

## Field contract for apps that publish posts

An app sends these fields with an application password, in the same request that creates or updates the post:

```http
POST /wp-json/wp/v2/posts/123
{ "meta": {
    "rank_math_focus_keyword": "main keyword,second keyword",
    "rank_math_title": "SEO title (60 characters or fewer)",
    "rank_math_description": "Meta description (155 characters or fewer)",
    "rank_math_primary_category": 7
} }
```

It reads them back with `GET /wp-json/wp/v2/posts/123?context=edit`, under `meta`. Only users who can edit the post can see or change these fields.

Schema: don't write `rank_math_rich_snippet` per post. In current Rank Math it is a legacy key, and when it is present Rank Math stops applying the post type's default schema. Posts get Article from the setting the setup script applies.

## Changing files you have customised

`gpp add seo` replaces the pack's post query, SEO helpers and post pages only when they are byte-for-byte a version that gpp shipped. If you have changed one, make these edits yourself.

**1. The post query** (`lib/graphql.ts` or wherever the post is fetched). Replace Yoast-style fields (`metaDesc`, `opengraphTitle`, `opengraphDescription`, `opengraphImage`, `canonical`) with the Rank Math selection, and ask for `uri` and `slug`:

```ts
import { RANK_MATH_SEO_FIELDS, RANK_MATH_SEO_LIST_FIELDS, type RankMathSeo } from './seo/rank-math'

// single post
post(id: $slug, idType: SLUG) {
  slug
  uri
  seo { ${RANK_MATH_SEO_FIELDS} }
  ...
}
// lists and cards
seo { ${RANK_MATH_SEO_LIST_FIELDS} }

// type
seo?: RankMathSeo
uri?: string
```

**2. Metadata** (the post page's `generateMetadata`, or a helper it calls):

```ts
import { rankMathMetadata } from '@/lib/seo/rank-math'

export async function generateMetadata({ params }) {
  const post = await getPost(...)
  return rankMathMetadata(post, { url: SITE_CONFIG.url, name: SITE_CONFIG.name })
}
```

Rank Math's title already includes the site name, so `rankMathMetadata` returns it as `title.absolute`. The layout's title template doesn't add the site name twice.

**3. JSON-LD** (in the post page's JSX):

```tsx
import { PostJsonLd } from '@/components/seo/JsonLd'

<PostJsonLd post={post} site={{ url: SITE_CONFIG.url, name: SITE_CONFIG.name }} />
```

Remove any other Article or BreadcrumbList JSON-LD the page already renders, so search engines don't see the post twice.

**4. Other readers.** Any code that reads `post.seo.metaDesc` should read `post.seo.description`. For Open Graph, use `post.seo.openGraph.title`, `.description` and `.image.url`.

## Checking it

Set the fields on one post in Rank Math, then open the post page's source. Check the `<title>`, `meta name="description"`, `link rel="canonical"`, the `og:*` and `twitter:*` tags, and `application/ld+json`. They should all use the Next.js domain. Then check `/sitemap.xml` and `/robots.txt`.

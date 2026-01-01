import { NextResponse } from 'next/server'
import { getPostBySlug, getPrimaryCategory, generateExcerpt } from '@/lib/posts'

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    const post = await getPostBySlug(slug)

    if (!post) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    const category = getPrimaryCategory(post)

    // Transform WordPress post to API response format
    const article = {
      id: post.databaseId.toString(),
      slug: post.slug,
      title: post.title,
      description: generateExcerpt(post.excerpt || post.content),
      content: post.content,
      category: category?.name || 'Uncategorized',
      metaTitle: post.seo?.title || post.title,
      metaDescription: post.seo?.metaDesc || generateExcerpt(post.excerpt || post.content),
      keywords: post.tags?.nodes?.map((tag) => tag.name).join(', ') || '',
      publishedAt: post.date,
      updatedAt: post.modified,
    }

    return NextResponse.json(article, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('Error fetching article:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to fetch article', details: errorMessage },
      { status: 500 }
    )
  }
}


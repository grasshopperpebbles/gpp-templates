import { NextResponse } from 'next/server'
import { getPosts, getPrimaryCategory, generateExcerpt } from '@/lib/posts'
import type { Post } from '@/lib/graphql'

export async function GET() {
  try {
    const data = await getPosts({ first: 100 })

    // Transform WordPress posts to API response format
    const articles = data.posts.nodes.map((post: Post) => {
      const category = getPrimaryCategory(post)
      return {
        id: post.databaseId.toString(),
        slug: post.slug,
        title: post.title,
        description: generateExcerpt(post.excerpt || post.content),
        category: category?.name || 'Uncategorized',
        publishedAt: post.date,
        updatedAt: post.modified,
      }
    })

    // Sort by published date (descending)
    articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

    return NextResponse.json(articles, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('Error fetching articles:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to fetch articles', details: errorMessage },
      { status: 500 }
    )
  }
}


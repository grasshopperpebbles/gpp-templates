import Link from 'next/link'
import Image from 'next/image'
import { Calendar, User } from 'lucide-react'
import { getPosts, getCategories, formatPostDate } from '@/lib/posts'
import type { Post, PostCategory } from '@/lib/graphql'

export const metadata = {
  title: 'Blog',
  description: 'Latest blog posts and articles',
}

export default async function BlogPage() {
  const [postsData, categories] = await Promise.all([
    getPosts({ first: 12 }),
    getCategories(),
  ])

  const posts = postsData.posts.nodes
  const primaryCategories = categories.filter(cat => !cat.parent?.node)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Blog</h1>
        <p className="text-lg text-muted-foreground">
          Explore our content by category
        </p>
      </div>

      {/* Categories */}
      {primaryCategories.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Categories</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {primaryCategories.map((category) => (
              <Link
                key={category.id}
                href={`/blog/${category.slug}`}
                className="rounded-lg border bg-card p-6 transition hover:border-primary hover:shadow-md"
              >
                <h3 className="text-lg font-semibold mb-2">{category.name}</h3>
                {category.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {category.description}
                  </p>
                )}
                {category.count !== undefined && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {category.count} {category.count === 1 ? 'post' : 'posts'}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Posts */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">Recent Posts</h2>
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <article
                key={post.id}
                className="rounded-lg border bg-card transition hover:shadow-lg"
              >
                {post.featuredImage?.node?.sourceUrl && (
                  <Link href={`/blog/${post.slug}`}>
                    <Image
                      src={post.featuredImage.node.sourceUrl}
                      alt={post.featuredImage.node.altText || post.title}
                      width={400}
                      height={250}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                  </Link>
                )}
                <div className="p-6">
                  <div className="mb-2 flex flex-wrap gap-2">
                    {post.categories?.nodes.map((category) => {
                      const catParent = category.parent?.node
                      const catPath = catParent
                        ? `/blog/${catParent.slug}/${category.slug}`
                        : `/blog/${category.slug}`
                      return (
                        <Link
                          key={category.id}
                          href={catPath}
                          className="text-xs font-medium text-primary hover:text-primary/80"
                        >
                          {category.name}
                        </Link>
                      )
                    })}
                  </div>
                  <Link href={`/blog/${post.slug}`}>
                    <h3 className="text-xl font-semibold mb-2 hover:text-primary">
                      {post.title}
                    </h3>
                  </Link>
                  {post.excerpt && (
                    <p className="mb-4 text-sm text-muted-foreground line-clamp-3">
                      {post.excerpt.replace(/<[^>]*>/g, '').substring(0, 150)}...
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <time dateTime={post.date}>
                      {formatPostDate(post.date)}
                    </time>
                    {post.author?.node?.name && (
                      <span>By {post.author.node.name}</span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">
            No posts yet. Check back soon!
          </p>
        )}
      </div>
    </div>
  )
}


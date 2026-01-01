import Link from 'next/link'
import Image from 'next/image'
import { Calendar, User } from 'lucide-react'
import { notFound } from 'next/navigation'
import { getPostsByCategory, getCategories, formatPostDate } from '@/lib/posts'
import type { Post, PostCategory } from '@/lib/graphql'

interface CategoryPageProps {
  params: Promise<{ category: string }>
}

export async function generateStaticParams() {
  const categories = await getCategories()
  // Only return parent categories (those without a parent)
  return categories
    .filter(cat => !cat.parent)
    .map((category) => ({
      category: category.slug,
    }))
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params
  const [categories, postsData] = await Promise.all([
    getCategories(),
    getPostsByCategory(category, { first: 20 }),
  ])

  const categoryData = categories.find(cat => cat.slug === category && !cat.parent)
  if (!categoryData) {
    notFound()
  }

  const subcategories = categories.filter(cat => cat.parent?.node?.slug === category)
  const posts = postsData.posts.nodes

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Category Header */}
      <div className="mb-12">
        <Link
          href="/blog"
          className="text-sm text-primary hover:text-primary/80 mb-4 inline-block"
        >
          ← Back to Blog
        </Link>
        <h1 className="text-4xl font-bold mb-4">{categoryData.name}</h1>
        {categoryData.description && (
          <p className="text-lg text-muted-foreground mb-2">
            {categoryData.description}
          </p>
        )}
        {categoryData.count !== undefined && (
          <p className="text-sm text-muted-foreground">
            {categoryData.count} {categoryData.count === 1 ? 'post' : 'posts'}
          </p>
        )}
      </div>

      {/* Subcategories */}
      {subcategories.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Subcategories</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subcategories.map((subcategory) => (
              <Link
                key={subcategory.id}
                href={`/blog/${category}/${subcategory.slug}`}
                className="rounded-lg border bg-card p-4 transition hover:border-primary hover:shadow-md"
              >
                <h3 className="font-semibold mb-1">{subcategory.name}</h3>
                {subcategory.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {subcategory.description}
                  </p>
                )}
                {subcategory.count !== undefined && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {subcategory.count} {subcategory.count === 1 ? 'post' : 'posts'}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Posts */}
      <div>
        <h2 className="text-xl font-semibold mb-6">Posts</h2>
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => {
              const primaryCategory = post.categories?.nodes?.[0]
              const parentCategory = primaryCategory?.parent?.node
              const postCategoryPath = parentCategory && primaryCategory
                ? `/blog/${parentCategory.slug}/${primaryCategory.slug}`
                : primaryCategory
                ? `/blog/category/${primaryCategory.slug}`
                : `/blog`

              return (
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
                      {post.categories?.nodes.map((cat) => {
                        const catParent = cat.parent?.node
                        const catPath = catParent
                          ? `/blog/${catParent.slug}/${cat.slug}`
                          : `/blog/${cat.slug}`
                        return (
                          <Link
                            key={cat.id}
                            href={catPath}
                            className="text-xs font-medium text-primary hover:text-primary/80"
                          >
                            {cat.name}
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
              )
            })}
          </div>
        ) : (
          <p className="text-muted-foreground">
            No posts in this category yet. Check back soon!
          </p>
        )}
      </div>
    </div>
  )
}


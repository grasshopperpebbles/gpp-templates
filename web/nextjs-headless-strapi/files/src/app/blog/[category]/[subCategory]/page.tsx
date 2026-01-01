import Link from 'next/link'
import Image from 'next/image'
import { Calendar, User } from 'lucide-react'
import { notFound } from 'next/navigation'
import { getPostsByCategory, getCategories, formatPostDate } from '@/lib/posts'
import type { Post, PostCategory } from '@/lib/graphql'

interface SubCategoryPageProps {
  params: Promise<{ category: string; subCategory: string }>
}

export async function generateStaticParams() {
  const categories = await getCategories()
  // Return all parent/subcategory combinations
  const params: Array<{ category: string; subCategory: string }> = []
  
  categories.forEach((cat) => {
    if (cat.parent?.node) {
      params.push({
        category: cat.parent.node.slug,
        subCategory: cat.slug,
      })
    }
  })
  
  return params
}

export default async function SubCategoryPage({ params }: SubCategoryPageProps) {
  const { category, subCategory } = await params
  const [categories, postsData] = await Promise.all([
    getCategories(),
    getPostsByCategory(subCategory, { first: 20 }),
  ])

  const parentCategory = categories.find(cat => cat.slug === category && !cat.parent)
  const subCategoryData = categories.find(
    cat => cat.slug === subCategory && cat.parent?.node?.slug === category
  )

  if (!parentCategory || !subCategoryData) {
    notFound()
  }

  const posts = postsData.posts.nodes

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="mb-8 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href="/blog" className="hover:text-foreground">
              Blog
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href={`/blog/${category}`} className="hover:text-foreground">
              {parentCategory.name}
            </Link>
          </li>
          <li>/</li>
          <li className="text-foreground font-medium">{subCategoryData.name}</li>
        </ol>
      </nav>

      {/* Category Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">{subCategoryData.name}</h1>
        {subCategoryData.description && (
          <p className="text-lg text-muted-foreground mb-2">
            {subCategoryData.description}
          </p>
        )}
        {subCategoryData.count !== undefined && (
          <p className="text-sm text-muted-foreground">
            {subCategoryData.count} {subCategoryData.count === 1 ? 'post' : 'posts'}
          </p>
        )}
      </div>

      {/* Posts */}
      <div>
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => {
              const primaryCategory = post.categories?.nodes?.[0]
              const postParentCategory = primaryCategory?.parent?.node
              const postCategoryPath = postParentCategory && primaryCategory
                ? `/blog/${postParentCategory.slug}/${primaryCategory.slug}`
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
            No posts in this subcategory yet. Check back soon!
          </p>
        )}
      </div>
    </div>
  )
}


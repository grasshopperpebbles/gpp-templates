import { sanityClient, postQuery } from '@/lib/sanity';
import type { Post } from '@/types/sanity';
import Link from 'next/link';

export default async function ArticlesPage() {
  const posts: Post[] = await sanityClient.fetch(postQuery);

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Articles</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <article key={post._id} className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-2">
              <Link href={`/articles/${post.slug.current}`} className="hover:underline">
                {post.title}
              </Link>
            </h2>
            {post.excerpt && (
              <p className="text-gray-600 mt-2">{post.excerpt}</p>
            )}
            {post.publishedAt && (
              <time className="text-sm text-gray-400 block mt-4">
                {new Date(post.publishedAt).toLocaleDateString()}
              </time>
            )}
          </article>
        ))}
      </div>
      {posts.length === 0 && (
        <p className="text-gray-500">No articles found.</p>
      )}
    </div>
  );
}


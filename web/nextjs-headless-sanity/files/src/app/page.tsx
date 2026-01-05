import { sanityClient, postQuery } from '@/lib/sanity';
import type { Post } from '@/types/sanity';
import Link from 'next/link';

export default async function HomePage() {
  const posts: Post[] = await sanityClient.fetch(postQuery, {}, { next: { revalidate: 60 } });

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-4xl font-bold mb-8">Welcome</h1>
      <p className="text-xl text-gray-600 mb-8">
        Latest articles from Sanity CMS
      </p>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.slice(0, 6).map((post) => (
          <article key={post._id} className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-2">
              <Link href={`/articles/${post.slug.current}`} className="hover:underline">
                {post.title}
              </Link>
            </h2>
            {post.excerpt && (
              <p className="text-gray-600 mt-2 text-sm">{post.excerpt}</p>
            )}
          </article>
        ))}
      </div>
      {posts.length > 6 && (
        <div className="mt-8 text-center">
          <Link href="/articles" className="text-blue-600 hover:underline">
            View all articles →
          </Link>
        </div>
      )}
    </div>
  );
}


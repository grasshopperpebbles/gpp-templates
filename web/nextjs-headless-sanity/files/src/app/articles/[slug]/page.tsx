import { sanityClient, postBySlugQuery } from '@/lib/sanity';
import { urlFor } from '@/lib/sanity';
import { notFound } from 'next/navigation';
import { PortableText } from '@portabletext/react';
import type { Post } from '@/types/sanity';
import Image from 'next/image';

interface Props {
  params: { slug: string };
}

export default async function ArticlePage({ params }: Props) {
  const post: Post = await sanityClient.fetch(postBySlugQuery(params.slug));

  if (!post) {
    notFound();
  }

  const imageUrl = post.mainImage?.asset?.url
    ? urlFor(post.mainImage).width(800).height(400).url()
    : null;

  return (
    <article className="container mx-auto py-8 px-4 max-w-3xl">
      <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
      {post.publishedAt && (
        <time className="text-gray-500 block mb-6">
          {new Date(post.publishedAt).toLocaleDateString()}
        </time>
      )}
      {imageUrl && (
        <div className="mb-8">
          <Image
            src={imageUrl}
            alt={post.title}
            width={800}
            height={400}
            className="rounded-lg"
          />
        </div>
      )}
      {post.content && (
        <div className="prose prose-lg max-w-none mt-8">
          <PortableText value={post.content} />
        </div>
      )}
    </article>
  );
}


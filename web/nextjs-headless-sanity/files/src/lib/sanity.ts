import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01';
const token = process.env.SANITY_API_TOKEN;

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: process.env.NODE_ENV === 'production',
  token,
});

const builder = imageUrlBuilder(sanityClient);

export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

// GROQ Queries
export const postQuery = `*[_type == "post" && defined(slug.current)] | order(publishedAt desc) {
  _id,
  title,
  slug,
  excerpt,
  publishedAt,
  "mainImage": mainImage.asset->url,
  "author": author->{name, image}
}`;

export const postBySlugQuery = (slug: string) => `*[_type == "post" && slug.current == "${slug}"][0] {
  _id,
  title,
  slug,
  excerpt,
  content,
  publishedAt,
  "mainImage": mainImage.asset->url,
  "author": author->{name, image, bio},
  categories[]->{title, slug}
}`;

export const allPostsQuery = `*[_type == "post" && defined(slug.current)] | order(publishedAt desc)`;


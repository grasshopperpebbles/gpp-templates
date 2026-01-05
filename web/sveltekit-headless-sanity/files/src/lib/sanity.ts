import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';
import { SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_VERSION } from '$env/static/public';

const projectId = SANITY_PROJECT_ID || '';
const dataset = SANITY_DATASET || 'production';
const apiVersion = SANITY_API_VERSION || '2024-01-01';
const token = import.meta.env.SANITY_API_TOKEN;

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: import.meta.env.PROD,
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


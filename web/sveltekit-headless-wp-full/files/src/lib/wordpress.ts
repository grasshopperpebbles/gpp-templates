import {
  graphqlClient,
  GET_POSTS,
  GET_POST_BY_SLUG,
  GET_CATEGORIES,
  GET_TAGS,
  GET_POSTS_BY_CATEGORY,
  GET_POSTS_BY_TAG,
  type Post,
  type PostCategory,
  type PostTag,
  type PostsResponse,
  type PostResponse,
  type CategoriesResponse,
  type TagsResponse,
} from "./graphql";

export interface GetPostsOptions {
  first?: number;
  after?: string;
  category?: string;
  tag?: string;
}

export async function getPosts(options: GetPostsOptions = {}): Promise<PostsResponse> {
  const { first = 10, after, category, tag } = options;
  return graphqlClient.query<PostsResponse>(GET_POSTS, {
    first,
    after,
    category,
    tag,
  });
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const response = await graphqlClient.query<PostResponse>(GET_POST_BY_SLUG, {
      slug,
    });
    return response.post;
  } catch (error) {
    console.error(`Error fetching post with slug "${slug}":`, error);
    return null;
  }
}

export async function getCategories(): Promise<PostCategory[]> {
  try {
    const response = await graphqlClient.query<CategoriesResponse>(GET_CATEGORIES);
    return response.categories.nodes;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export async function getTags(): Promise<PostTag[]> {
  try {
    const response = await graphqlClient.query<TagsResponse>(GET_TAGS);
    return response.tags.nodes;
  } catch (error) {
    console.error("Error fetching tags:", error);
    return [];
  }
}

export async function getPostsByCategory(
  categorySlug: string,
  options: { first?: number; after?: string } = {}
): Promise<PostsResponse> {
  const { first = 10, after } = options;
  return graphqlClient.query<PostsResponse>(GET_POSTS_BY_CATEGORY, {
    categorySlug,
    first,
    after,
  });
}

export async function getPostsByTag(
  tagSlug: string,
  options: { first?: number; after?: string } = {}
): Promise<PostsResponse> {
  const { first = 10, after } = options;
  return graphqlClient.query<PostsResponse>(GET_POSTS_BY_TAG, {
    tagSlug,
    first,
    after,
  });
}

export function getPrimaryCategory(post: Post): { name: string; slug: string } | null {
  if (!post.categories?.nodes?.length) return null;
  return {
    name: post.categories.nodes[0].name,
    slug: post.categories.nodes[0].slug,
  };
}

export { type Post, type PostCategory, type PostTag, type PostsResponse };

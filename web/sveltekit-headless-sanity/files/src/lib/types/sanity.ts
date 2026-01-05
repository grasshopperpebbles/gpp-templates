/**
 * Sanity Content Types
 * Auto-generated from Sanity schema
 */

export interface SanityDocument {
  _id: string;
  _type: string;
  _createdAt: string;
  _updatedAt: string;
  _rev: string;
}

export interface Post extends SanityDocument {
  _type: 'post';
  title: string;
  slug: {
    _type: 'slug';
    current: string;
  };
  excerpt?: string;
  content?: any[]; // Portable Text
  publishedAt?: string;
  mainImage?: {
    _type: 'image';
    asset: {
      _type: 'reference';
      _ref: string;
      url?: string;
    };
  };
  author?: {
    _type: 'reference';
    _ref: string;
    name?: string;
    image?: {
      _type: 'image';
      asset: {
        _type: 'reference';
        _ref: string;
        url?: string;
      };
    };
  };
  categories?: Array<{
    _type: 'reference';
    _ref: string;
    title?: string;
    slug?: {
      _type: 'slug';
      current: string;
    };
  }>;
}

export interface Author extends SanityDocument {
  _type: 'author';
  name: string;
  email?: string;
  bio?: any[]; // Portable Text
  image?: {
    _type: 'image';
    asset: {
      _type: 'reference';
      _ref: string;
      url?: string;
    };
  };
}

export interface Category extends SanityDocument {
  _type: 'category';
  title: string;
  slug: {
    _type: 'slug';
    current: string;
  };
  description?: string;
}


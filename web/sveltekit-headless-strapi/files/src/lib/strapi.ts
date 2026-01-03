import { config } from "./config";

export interface StrapiResponse<T> {
  data: T;
  meta: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface StrapiImage {
  id: number;
  url: string;
  alternativeText: string | null;
  width: number;
  height: number;
  formats?: {
    thumbnail?: { url: string };
    small?: { url: string };
    medium?: { url: string };
    large?: { url: string };
  };
}

export interface Article {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  featuredImage?: StrapiImage;
  category?: Category;
  author?: Author;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

export interface Author {
  id: number;
  name: string;
  bio?: string;
  avatar?: StrapiImage;
}

export interface SiteSetting {
  id: number;
  title: string;
  featuredTitle?: string;
  featuredDescription?: string;
  featuredItems?: Array<{
    id: number;
    attributes: Record<string, unknown>; // Content type specific attributes
  }>;
}

class StrapiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.strapiUrl;
  }

  private async fetch<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}/api${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Strapi API error: ${response.status}`);
    }

    return response.json();
  }

  async getArticles(params?: {
    page?: number;
    pageSize?: number;
    category?: string;
  }): Promise<StrapiResponse<Article[]>> {
    const query = new URLSearchParams();
    query.set("populate", "*");
    query.set("sort", "publishedAt:desc");

    if (params?.page) {
      query.set("pagination[page]", params.page.toString());
    }
    if (params?.pageSize) {
      query.set("pagination[pageSize]", params.pageSize.toString());
    }
    if (params?.category) {
      query.set("filters[category][slug][$eq]", params.category);
    }

    return this.fetch(`/articles?${query}`);
  }

  async getArticle(slug: string): Promise<StrapiResponse<Article[]>> {
    const query = new URLSearchParams();
    query.set("populate", "*");
    query.set("filters[slug][$eq]", slug);

    return this.fetch(`/articles?${query}`);
  }

  async getCategories(): Promise<StrapiResponse<Category[]>> {
    return this.fetch("/categories?populate=*");
  }

  async getCategory(slug: string): Promise<StrapiResponse<Category[]>> {
    const query = new URLSearchParams();
    query.set("filters[slug][$eq]", slug);

    return this.fetch(`/categories?${query}`);
  }

  async getFeaturedItems(): Promise<StrapiResponse<SiteSetting[]>> {
    const query = new URLSearchParams();
    query.set("populate[featuredItems][populate]", "*");
    query.set("pagination[limit]", "1");

    return this.fetch(`/site-settings?${query}`);
  }

  getImageUrl(image?: StrapiImage, size?: "thumbnail" | "small" | "medium" | "large"): string {
    if (!image) return "/placeholder.jpg";

    const url = size && image.formats?.[size]?.url
      ? image.formats[size].url
      : image.url;

    // Handle relative URLs from Strapi
    if (url.startsWith("/")) {
      return `${this.baseUrl}${url}`;
    }

    return url;
  }
}

export const strapi = new StrapiClient();

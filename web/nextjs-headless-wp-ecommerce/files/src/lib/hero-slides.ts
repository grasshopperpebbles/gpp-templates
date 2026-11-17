import { cache } from "react";

export interface HeroSlide {
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  imageAlt: string;
  linkUrl: string | null;
  linkText: string | null;
  sortOrder: number;
}

const HERO_SLIDES_QUERY = `
  query GetHeroSlides {
    heroSlides(first: 10, where: { orderby: { field: MENU_ORDER, order: ASC } }) {
      nodes {
        title
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        heroSlideFields {
          heroSubtitle
          heroLinkUrl
          heroLinkText
          heroSortOrder
        }
      }
    }
  }
`;

interface HeroSlidesResponse {
  data: {
    heroSlides: {
      nodes: Array<{
        title: string;
        featuredImage: {
          node: {
            sourceUrl: string;
            altText: string;
          };
        } | null;
        heroSlideFields: {
          heroSubtitle: string | null;
          heroLinkUrl: string | null;
          heroLinkText: string | null;
          heroSortOrder: number | null;
        };
      }>;
    };
  };
}

export const getHeroSlides = cache(async (): Promise<HeroSlide[]> => {
  const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT;
  if (!endpoint) {
    return [];
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: HERO_SLIDES_QUERY }),
    });
    if (!response.ok) {
      return [];
    }
    const res = (await response.json()) as HeroSlidesResponse;
    return res.data.heroSlides.nodes.map((node) => ({
      title: node.title,
      subtitle: node.heroSlideFields.heroSubtitle || null,
      imageUrl: node.featuredImage?.node.sourceUrl || null,
      imageAlt: node.featuredImage?.node.altText || node.title,
      linkUrl: node.heroSlideFields.heroLinkUrl || null,
      linkText: node.heroSlideFields.heroLinkText || null,
      sortOrder: node.heroSlideFields.heroSortOrder ?? 0,
    }));
  } catch {
    return [];
  }
});

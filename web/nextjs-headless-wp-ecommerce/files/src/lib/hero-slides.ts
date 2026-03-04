import { cache } from "react";
import { env } from "@/lib/env";
import { wpGraphql } from "@/lib/clients/wp";

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
  if (!env.wpGraphqlEndpoint) {
    return [];
  }

  try {
    const res = await wpGraphql<HeroSlidesResponse>(HERO_SLIDES_QUERY);
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

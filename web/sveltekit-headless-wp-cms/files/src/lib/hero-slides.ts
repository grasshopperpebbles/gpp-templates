import { graphqlClient } from "./graphql";

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
}

export async function getHeroSlides(): Promise<HeroSlide[]> {
  try {
    const res = await graphqlClient.query<HeroSlidesResponse>(HERO_SLIDES_QUERY);
    return res.heroSlides.nodes.map((node) => ({
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
}

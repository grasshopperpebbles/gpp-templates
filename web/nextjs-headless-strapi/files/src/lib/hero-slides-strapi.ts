import { cache } from "react";
import type { HeroSlide } from "@/lib/hero-slides";

interface StrapiSlide {
  title: string;
  subtitle: string | null;
  image: {
    url: string;
    alternativeText: string | null;
  } | null;
  linkUrl: string | null;
  linkText: string | null;
}

interface StrapiHomepageResponse {
  data: {
    attributes: {
      heroSlides: StrapiSlide[];
    };
  };
}

export const getHeroSlidesStrapi = cache(
  async (): Promise<HeroSlide[]> => {
    const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL;
    if (!strapiUrl) {
      return [];
    }

    try {
      const res = await fetch(
        `${strapiUrl}/api/homepage?populate[heroSlides][populate]=*`,
        { next: { revalidate: 60 } },
      );
      if (!res.ok) return [];

      const json: StrapiHomepageResponse = await res.json();
      const slides = json.data?.attributes?.heroSlides ?? [];

      return slides.map((slide, index) => ({
        title: slide.title,
        subtitle: slide.subtitle || null,
        imageUrl: slide.image?.url
          ? `${strapiUrl}${slide.image.url}`
          : null,
        imageAlt: slide.image?.alternativeText || slide.title,
        linkUrl: slide.linkUrl || null,
        linkText: slide.linkText || null,
        sortOrder: index,
      }));
    } catch {
      return [];
    }
  },
);

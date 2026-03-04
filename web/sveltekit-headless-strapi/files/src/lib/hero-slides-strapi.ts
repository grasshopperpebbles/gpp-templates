import { config } from "./config";
import type { HeroSlide } from "./hero-slides";

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

interface HomepageResponse {
  data: {
    attributes: {
      heroSlides: StrapiSlide[];
    };
  };
}

export async function getHeroSlidesStrapi(): Promise<HeroSlide[]> {
  try {
    const res = await fetch(
      `${config.strapiUrl}/api/homepage?populate[heroSlides][populate]=*`
    );
    if (!res.ok) return [];

    const json: HomepageResponse = await res.json();
    const slides = json.data?.attributes?.heroSlides ?? [];

    return slides.map((slide, index) => ({
      title: slide.title,
      subtitle: slide.subtitle || null,
      imageUrl: slide.image?.url
        ? `${config.strapiUrl}${slide.image.url}`
        : null,
      imageAlt: slide.image?.alternativeText || slide.title,
      linkUrl: slide.linkUrl || null,
      linkText: slide.linkText || null,
      sortOrder: index,
    }));
  } catch {
    return [];
  }
}

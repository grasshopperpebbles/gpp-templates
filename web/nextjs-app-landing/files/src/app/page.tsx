import {
  Hero,
  Features,
  Screenshots,
  Testimonials,
  FAQ,
  DownloadButtons,
} from "@/components/app-landing";

import {
  APP_CONFIG,
  FEATURES,
  SCREENSHOTS,
  TESTIMONIALS,
  FAQ_ITEMS,
  CTA_CONFIG,
} from "./content";

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <Hero
        appName={APP_CONFIG.name}
        tagline={APP_CONFIG.tagline}
        description={APP_CONFIG.description}
        heroImage={APP_CONFIG.heroImage}
      />

      <Features features={FEATURES} />

      <Screenshots screenshots={SCREENSHOTS} />

      <Testimonials testimonials={TESTIMONIALS} />

      <FAQ items={FAQ_ITEMS} />

      {/* Final CTA Section */}
      <section className="py-20 lg:py-32 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {CTA_CONFIG.headline}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            {CTA_CONFIG.subheadline}
          </p>
          <div className="mt-8">
            <DownloadButtons />
          </div>
        </div>
      </section>
    </main>
  );
}

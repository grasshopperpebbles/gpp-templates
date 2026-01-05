"use client";

import Image from "next/image";
import { DownloadButtons } from "./download-buttons";

interface HeroProps {
  appName: string;
  tagline: string;
  description: string;
  heroImage?: string;
}

export function Hero({ appName, tagline, description, heroImage }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          {/* Text Content */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {appName}
            </h1>
            <p className="mt-4 text-xl text-primary font-medium">
              {tagline}
            </p>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0">
              {description}
            </p>
            <div className="mt-8">
              <DownloadButtons />
            </div>
          </div>

          {/* Hero Image / Device Mockup */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-[280px] h-[560px] lg:w-[320px] lg:h-[640px]">
              {/* Phone Frame */}
              <div className="absolute inset-0 bg-gray-900 rounded-[3rem] shadow-2xl" />
              <div className="absolute inset-[3px] bg-gray-800 rounded-[2.8rem]" />
              <div className="absolute inset-[8px] bg-black rounded-[2.5rem] overflow-hidden">
                {heroImage ? (
                  <Image
                    src={heroImage}
                    alt={`${appName} screenshot`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <span className="text-muted-foreground">App Screenshot</span>
                  </div>
                )}
              </div>
              {/* Notch */}
              <div className="absolute top-[12px] left-1/2 -translate-x-1/2 w-[120px] h-[28px] bg-black rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
    </section>
  );
}

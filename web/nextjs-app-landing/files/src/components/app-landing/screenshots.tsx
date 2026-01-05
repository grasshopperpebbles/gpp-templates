"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Screenshot {
  src: string;
  alt: string;
  caption?: string;
}

interface ScreenshotsProps {
  title?: string;
  subtitle?: string;
  screenshots: Screenshot[];
}

export function Screenshots({
  title = "See it in action",
  subtitle = "Take a closer look at what our app can do",
  screenshots,
}: ScreenshotsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? screenshots.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === screenshots.length - 1 ? 0 : prev + 1));
  };

  if (screenshots.length === 0) return null;

  return (
    <section className="py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {title}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {subtitle}
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Screenshots Container */}
          <div className="flex justify-center items-center gap-4 overflow-hidden">
            {/* Previous Screenshots (faded) */}
            <div className="hidden md:block relative w-[180px] h-[360px] opacity-40 scale-90 transition-all">
              <div className="absolute inset-0 bg-gray-900 rounded-[2rem]" />
              <div className="absolute inset-[6px] bg-black rounded-[1.7rem] overflow-hidden">
                <Image
                  src={screenshots[(currentIndex - 1 + screenshots.length) % screenshots.length].src}
                  alt=""
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Current Screenshot */}
            <div className="relative w-[240px] h-[480px] lg:w-[280px] lg:h-[560px] z-10">
              <div className="absolute inset-0 bg-gray-900 rounded-[2.5rem] shadow-2xl" />
              <div className="absolute inset-[3px] bg-gray-800 rounded-[2.3rem]" />
              <div className="absolute inset-[8px] bg-black rounded-[2rem] overflow-hidden">
                <Image
                  src={screenshots[currentIndex].src}
                  alt={screenshots[currentIndex].alt}
                  fill
                  className="object-cover"
                />
              </div>
              {/* Notch */}
              <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-[100px] h-[24px] bg-black rounded-full" />
            </div>

            {/* Next Screenshots (faded) */}
            <div className="hidden md:block relative w-[180px] h-[360px] opacity-40 scale-90 transition-all">
              <div className="absolute inset-0 bg-gray-900 rounded-[2rem]" />
              <div className="absolute inset-[6px] bg-black rounded-[1.7rem] overflow-hidden">
                <Image
                  src={screenshots[(currentIndex + 1) % screenshots.length].src}
                  alt=""
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={goToPrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background border shadow-md hover:bg-muted transition-colors"
            aria-label="Previous screenshot"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background border shadow-md hover:bg-muted transition-colors"
            aria-label="Next screenshot"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Caption */}
          {screenshots[currentIndex].caption && (
            <p className="text-center mt-6 text-muted-foreground">
              {screenshots[currentIndex].caption}
            </p>
          )}

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {screenshots.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? "bg-primary w-6"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
                aria-label={`Go to screenshot ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

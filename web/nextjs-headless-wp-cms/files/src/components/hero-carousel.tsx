"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HeroSlide } from "@/lib/hero-slides";

interface HeroCarouselProps {
  slides: HeroSlide[];
  autoRotateMs?: number;
}

export function HeroCarousel({
  slides,
  autoRotateMs = 5000,
}: HeroCarouselProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) =>
      setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (paused || prefersReducedMotion || slides.length <= 1) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }
    timerRef.current = setInterval(next, autoRotateMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, prefersReducedMotion, slides.length, autoRotateMs, next]);

  if (slides.length === 0) return null;

  const slide = slides[index];

  return (
    <section
      className="relative w-full overflow-hidden bg-zinc-900"
      style={{ height: "clamp(300px, 50vw, 600px)" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Hero slides"
    >
      {/* Slide image */}
      {slide.imageUrl && (
        <Image
          src={slide.imageUrl}
          alt={slide.imageAlt}
          fill
          className="object-cover"
          priority={index === 0}
          sizes="100vw"
        />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Text content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          {slide.title}
        </h2>
        {slide.subtitle && (
          <p className="mt-3 max-w-xl text-lg text-white/90 sm:text-xl">
            {slide.subtitle}
          </p>
        )}
        {slide.linkUrl && slide.linkText && (
          <Link
            href={slide.linkUrl}
            className="mt-6 inline-block rounded-md bg-white px-6 py-3 text-sm font-medium text-zinc-900 transition hover:bg-white/90"
          >
            {slide.linkText}
          </Link>
        )}
      </div>

      {/* Navigation buttons */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-2.5 w-2.5 rounded-full transition ${
                i === index ? "bg-white" : "bg-white/50"
              }`}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index ? "true" : undefined}
            />
          ))}
        </div>
      )}
    </section>
  );
}

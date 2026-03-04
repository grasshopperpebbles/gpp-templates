<script lang="ts">
  import type { HeroSlide } from "$lib/hero-slides";

  interface Props {
    slides: HeroSlide[];
    autoRotateMs?: number;
  }

  let { slides, autoRotateMs = 5000 }: Props = $props();

  let index = $state(0);
  let paused = $state(false);
  let prefersReducedMotion = $state(false);
  let timer: ReturnType<typeof setInterval> | null = null;

  function next() {
    index = (index + 1) % slides.length;
  }

  function prev() {
    index = (index - 1 + slides.length) % slides.length;
  }

  function goTo(i: number) {
    index = i;
  }

  $effect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    prefersReducedMotion = mq.matches;
    const handler = (e: MediaQueryListEvent) => {
      prefersReducedMotion = e.matches;
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  });

  $effect(() => {
    if (timer) clearInterval(timer);
    timer = null;

    if (!paused && !prefersReducedMotion && slides.length > 1) {
      timer = setInterval(next, autoRotateMs);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  });
</script>

{#if slides.length > 0}
  {@const slide = slides[index]}
  <section
    class="relative w-full overflow-hidden bg-gray-900"
    style="height: clamp(300px, 50vw, 600px)"
    role="region"
    aria-roledescription="carousel"
    aria-label="Hero slides"
    onmouseenter={() => (paused = true)}
    onmouseleave={() => (paused = false)}
    onfocusin={() => (paused = true)}
    onfocusout={() => (paused = false)}
  >
    <!-- Slide image -->
    {#if slide.imageUrl}
      <img
        src={slide.imageUrl}
        alt={slide.imageAlt}
        class="absolute inset-0 w-full h-full object-cover"
        loading={index === 0 ? "eager" : "lazy"}
      />
    {/if}

    <!-- Overlay -->
    <div class="absolute inset-0 bg-black/40"></div>

    <!-- Text content -->
    <div class="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
      <h2 class="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
        {slide.title}
      </h2>
      {#if slide.subtitle}
        <p class="mt-3 max-w-xl text-lg text-white/90 sm:text-xl">
          {slide.subtitle}
        </p>
      {/if}
      {#if slide.linkUrl && slide.linkText}
        <a
          href={slide.linkUrl}
          class="mt-6 inline-block rounded-md bg-white px-6 py-3 text-sm font-medium text-gray-900 transition hover:bg-white/90"
        >
          {slide.linkText}
        </a>
      {/if}
    </div>

    <!-- Navigation buttons -->
    {#if slides.length > 1}
      <button
        onclick={prev}
        class="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
        aria-label="Previous slide"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onclick={next}
        class="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
        aria-label="Next slide"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <!-- Dot indicators -->
      <div class="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {#each slides as _, i}
          <button
            onclick={() => goTo(i)}
            class="h-2.5 w-2.5 rounded-full transition {i === index ? 'bg-white' : 'bg-white/50'}"
            aria-label="Go to slide {i + 1}"
            aria-current={i === index ? "true" : undefined}
          ></button>
        {/each}
      </div>
    {/if}
  </section>
{/if}

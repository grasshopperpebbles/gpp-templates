<script lang="ts">
  const features = [
    {
      icon: "bolt",
      title: "Lightning Fast",
      description: "Built for speed with optimized performance. Get instant feedback as you develop.",
    },
    {
      icon: "puzzle",
      title: "Extensible",
      description: "Customize and extend functionality with a powerful plugin system.",
    },
    {
      icon: "shield",
      title: "Type Safe",
      description: "Full TypeScript support with comprehensive type definitions.",
    },
    {
      icon: "code",
      title: "Developer Experience",
      description: "Intuitive APIs and excellent documentation to get you started quickly.",
    },
    {
      icon: "refresh",
      title: "Hot Reload",
      description: "See changes instantly without losing application state.",
    },
    {
      icon: "globe",
      title: "Cross Platform",
      description: "Works on all major platforms and integrates with your existing tools.",
    },
  ];
</script>

<section class="py-20 bg-gray-50 dark:bg-gray-900">
  <div class="container mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
      <h2 class="text-3xl sm:text-4xl font-bold mb-4">
        Everything you need
      </h2>
      <p class="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
        DevTool provides all the features you need to build modern applications efficiently.
      </p>
    </div>
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      {#each features as feature}
        <div class="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div class="w-12 h-12 rounded-lg bg-brand-100 dark:bg-brand-900 flex items-center justify-center mb-4">
            {#if feature.icon === "bolt"}
              <svg class="w-6 h-6 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            {:else if feature.icon === "puzzle"}
              <svg class="w-6 h-6 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
              </svg>
            {:else if feature.icon === "shield"}
              <svg class="w-6 h-6 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            {:else if feature.icon === "code"}
              <svg class="w-6 h-6 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            {:else if feature.icon === "refresh"}
              <svg class="w-6 h-6 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            {:else if feature.icon === "globe"}
              <svg class="w-6 h-6 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            {/if}
          </div>
          <h3 class="text-lg font-semibold mb-2">{feature.title}</h3>
          <p class="text-gray-600 dark:text-gray-400">{feature.description}</p>
        </div>
      {/each}
    </div>
  </div>
</section>

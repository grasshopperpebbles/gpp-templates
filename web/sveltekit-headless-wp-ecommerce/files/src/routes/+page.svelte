<script lang="ts">
  import ProductCard from "$lib/components/product/ProductCard.svelte";
  import { config } from "$lib/config";
  import type { PageData } from "./$types";

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
</script>

<svelte:head>
  <title>{config.appName}</title>
  <meta name="description" content={config.appDescription} />
</svelte:head>

<section class="py-16 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
  <div class="container mx-auto px-4 text-center">
    <h1 class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
      {config.appName}
    </h1>
    <p class="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
      {config.appDescription}
    </p>
    <a
      href="/products"
      class="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors"
    >
      Shop Now
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </a>
  </div>
</section>

<section class="py-16">
  <div class="container mx-auto px-4">
    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-8">
      Featured Products
    </h2>

    {#if data.products.length > 0}
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {#each data.products as product}
          <ProductCard {product} />
        {/each}
      </div>

      <div class="mt-12 text-center">
        <a
          href="/products"
          class="inline-flex items-center gap-2 px-6 py-3 border-2 border-brand-600 text-brand-600 font-medium rounded-lg hover:bg-brand-600 hover:text-white transition-colors"
        >
          View All Products
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    {:else}
      <div class="text-center py-12">
        <p class="text-gray-600 dark:text-gray-400">
          No products found. Connect your WooCommerce store to get started.
        </p>
      </div>
    {/if}
  </div>
</section>

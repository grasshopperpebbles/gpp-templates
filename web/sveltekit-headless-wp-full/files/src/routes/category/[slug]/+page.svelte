<script lang="ts">
  import ProductCard from "$lib/components/product/ProductCard.svelte";
  import type { PageData } from "./$types";

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
</script>

<svelte:head>
  <title>{data.categoryName} | My Store</title>
  <meta name="description" content="Products in {data.categoryName} category" />
</svelte:head>

<section class="py-16">
  <div class="container mx-auto px-4">
    <div class="mb-12">
      <a
        href="/products"
        class="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        All Products
      </a>

      <h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
        {data.categoryName}
      </h1>
    </div>

    {#if data.products.length > 0}
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {#each data.products as product}
          <ProductCard {product} />
        {/each}
      </div>
    {:else}
      <div class="text-center py-12">
        <p class="text-gray-600 dark:text-gray-400">
          No products found in this category.
        </p>
      </div>
    {/if}
  </div>
</section>

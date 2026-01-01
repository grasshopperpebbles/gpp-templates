<script lang="ts">
  import ProductCard from "$lib/components/product/ProductCard.svelte";
  import type { PageData } from "./$types";

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
</script>

<svelte:head>
  <title>Products | My Store</title>
  <meta name="description" content="Browse our product catalog" />
</svelte:head>

<section class="py-16">
  <div class="container mx-auto px-4">
    <div class="mb-12">
      <h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
        Products
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Browse our collection of products.
      </p>
    </div>

    {#if data.categories.length > 0}
      <div class="flex flex-wrap gap-2 mb-8">
        <a
          href="/products"
          class="px-4 py-2 text-sm font-medium rounded-full transition-colors bg-brand-600 text-white"
        >
          All
        </a>
        {#each data.categories as category}
          <a
            href="/category/{category.slug}"
            class="px-4 py-2 text-sm font-medium rounded-full transition-colors bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            {category.name}
          </a>
        {/each}
      </div>
    {/if}

    {#if data.products.length > 0}
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {#each data.products as product}
          <ProductCard {product} />
        {/each}
      </div>
    {:else}
      <div class="text-center py-12">
        <p class="text-gray-600 dark:text-gray-400">
          No products found.
        </p>
      </div>
    {/if}
  </div>
</section>

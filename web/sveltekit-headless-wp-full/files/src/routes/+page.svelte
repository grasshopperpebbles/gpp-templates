<script lang="ts">
  import ProductCard from "$lib/components/product/ProductCard.svelte";
  import PostCard from "$lib/components/blog/PostCard.svelte";
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
    <div class="flex items-center justify-center gap-4">
      <a
        href="/products"
        class="px-6 py-3 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors"
      >
        Shop Now
      </a>
      <a
        href="/blog"
        class="px-6 py-3 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors"
      >
        Read Blog
      </a>
    </div>
  </div>
</section>

<section class="py-16">
  <div class="container mx-auto px-4">
    <div class="flex items-center justify-between mb-8">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
        Featured Products
      </h2>
      <a href="/products" class="text-brand-600 dark:text-brand-400 hover:underline">
        View All
      </a>
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
          No products found.
        </p>
      </div>
    {/if}
  </div>
</section>

<section class="py-16 bg-gray-50 dark:bg-gray-900">
  <div class="container mx-auto px-4">
    <div class="flex items-center justify-between mb-8">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
        Latest Posts
      </h2>
      <a href="/blog" class="text-brand-600 dark:text-brand-400 hover:underline">
        View All
      </a>
    </div>

    {#if data.posts.length > 0}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {#each data.posts as post}
          <PostCard {post} />
        {/each}
      </div>
    {:else}
      <div class="text-center py-12">
        <p class="text-gray-600 dark:text-gray-400">
          No posts found.
        </p>
      </div>
    {/if}
  </div>
</section>

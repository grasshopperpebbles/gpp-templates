<script lang="ts">
  import ArticleCard from "$lib/components/blog/ArticleCard.svelte";
  import Pagination from "$lib/components/blog/Pagination.svelte";
  import type { PageData } from "./$types";

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
</script>

<svelte:head>
  <title>{data.category.name} | My Blog</title>
  <meta name="description" content={data.category.description || `Articles in ${data.category.name}`} />
</svelte:head>

<section class="py-16">
  <div class="container mx-auto px-4">
    <div class="mb-12">
      <a
        href="/blog"
        class="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        All Articles
      </a>

      <h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
        {data.category.name}
      </h1>

      {#if data.category.description}
        <p class="text-gray-600 dark:text-gray-400">
          {data.category.description}
        </p>
      {/if}
    </div>

    {#if data.articles.length > 0}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {#each data.articles as article}
          <ArticleCard {article} />
        {/each}
      </div>

      <div class="mt-12">
        <Pagination
          currentPage={data.pagination.page}
          pageCount={data.pagination.pageCount}
          basePath="/category/{data.category.slug}"
        />
      </div>
    {:else}
      <div class="text-center py-12">
        <p class="text-gray-600 dark:text-gray-400">
          No articles found in this category.
        </p>
      </div>
    {/if}
  </div>
</section>

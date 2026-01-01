<script lang="ts">
  import PostCard from "$lib/components/blog/PostCard.svelte";
  import Pagination from "$lib/components/blog/Pagination.svelte";
  import type { PageData } from "./$types";

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
</script>

<svelte:head>
  <title>Blog | My Blog</title>
  <meta name="description" content="Read our latest posts and insights" />
</svelte:head>

<section class="py-16">
  <div class="container mx-auto px-4">
    <div class="mb-12">
      <h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
        Blog
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Explore our latest posts, tutorials, and insights.
      </p>
    </div>

    {#if data.categories.length > 0}
      <div class="flex flex-wrap gap-2 mb-8">
        <a
          href="/blog"
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

    {#if data.posts.length > 0}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {#each data.posts as post}
          <PostCard {post} />
        {/each}
      </div>

      <div class="mt-12">
        <Pagination
          hasNextPage={data.pageInfo.hasNextPage}
          hasPreviousPage={data.pageInfo.hasPreviousPage}
          currentCursor={data.pageInfo.endCursor}
        />
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

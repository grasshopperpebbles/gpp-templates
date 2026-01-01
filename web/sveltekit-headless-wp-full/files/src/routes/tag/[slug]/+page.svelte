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
  <title>#{data.tagName} | My Blog</title>
  <meta name="description" content="Posts tagged with {data.tagName}" />
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
        All Posts
      </a>

      <h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
        #{data.tagName}
      </h1>
    </div>

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
          basePath="/tag/{data.tagSlug}"
        />
      </div>
    {:else}
      <div class="text-center py-12">
        <p class="text-gray-600 dark:text-gray-400">
          No posts found with this tag.
        </p>
      </div>
    {/if}
  </div>
</section>

<script lang="ts">
  import { formatDate, calculateReadingTime } from "$lib/utils";
  import type { PageData } from "./$types";

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
  const { post } = data;
  const readingTime = calculateReadingTime(post.content);
</script>

<svelte:head>
  <title>{post.title} | My Blog</title>
  <meta name="description" content={post.excerpt?.replace(/<[^>]*>/g, "").slice(0, 160)} />
</svelte:head>

<article class="py-16">
  <div class="container mx-auto px-4">
    <div class="max-w-3xl mx-auto">
      <header class="mb-8">
        {#if post.categories?.nodes?.length}
          <a
            href="/category/{post.categories.nodes[0].slug}"
            class="text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline"
          >
            {post.categories.nodes[0].name}
          </a>
        {/if}

        <h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-2 mb-4">
          {post.title}
        </h1>

        <div class="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          {#if post.author?.node}
            <div class="flex items-center gap-2">
              {#if post.author.node.avatar}
                <img
                  src={post.author.node.avatar.url}
                  alt={post.author.node.name}
                  class="w-8 h-8 rounded-full object-cover"
                />
              {/if}
              <span>{post.author.node.name}</span>
            </div>
            <span>&middot;</span>
          {/if}
          <time datetime={post.date}>
            {formatDate(post.date)}
          </time>
          <span>&middot;</span>
          <span>{readingTime} min read</span>
        </div>
      </header>

      {#if post.featuredImage?.node}
        <div class="aspect-video overflow-hidden rounded-xl mb-8">
          <img
            src={post.featuredImage.node.sourceUrl}
            alt={post.featuredImage.node.altText || post.title}
            class="w-full h-full object-cover"
          />
        </div>
      {/if}

      <div class="prose prose-lg dark:prose-invert max-w-none">
        {@html post.content}
      </div>

      {#if post.tags?.nodes?.length}
        <div class="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
          <div class="flex flex-wrap gap-2">
            {#each post.tags.nodes as tag}
              <a
                href="/tag/{tag.slug}"
                class="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                #{tag.name}
              </a>
            {/each}
          </div>
        </div>
      {/if}

      <footer class="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
        <a
          href="/blog"
          class="inline-flex items-center gap-2 text-brand-600 dark:text-brand-400 hover:underline"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Blog
        </a>
      </footer>
    </div>
  </div>
</article>

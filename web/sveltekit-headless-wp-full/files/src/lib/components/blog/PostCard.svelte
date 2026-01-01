<script lang="ts">
  import type { Post } from "$lib/wordpress";
  import { formatDate } from "$lib/utils";

  interface Props {
    post: Post;
  }

  let { post }: Props = $props();
</script>

<article class="group">
  <a href="/blog/{post.slug}" class="block">
    {#if post.featuredImage?.node}
      <div class="aspect-video overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 mb-4">
        <img
          src={post.featuredImage.node.sourceUrl}
          alt={post.featuredImage.node.altText || post.title}
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
    {:else}
      <div class="aspect-video rounded-lg bg-gray-100 dark:bg-gray-800 mb-4 flex items-center justify-center">
        <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      </div>
    {/if}

    <div class="space-y-2">
      {#if post.categories?.nodes?.length}
        <span class="text-sm font-medium text-brand-600 dark:text-brand-400">
          {post.categories.nodes[0].name}
        </span>
      {/if}

      <h2 class="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
        {post.title}
      </h2>

      <div class="text-gray-600 dark:text-gray-400 line-clamp-2">
        {@html post.excerpt}
      </div>

      <div class="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-500">
        {#if post.author?.node}
          <span>{post.author.node.name}</span>
          <span>&middot;</span>
        {/if}
        <time datetime={post.date}>
          {formatDate(post.date)}
        </time>
      </div>
    </div>
  </a>
</article>

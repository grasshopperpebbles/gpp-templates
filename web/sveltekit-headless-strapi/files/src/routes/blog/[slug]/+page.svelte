<script lang="ts">
  import { strapi } from "$lib/strapi";
  import { formatDate } from "$lib/utils";
  import type { PageData } from "./$types";

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
  const { article } = data;
</script>

<svelte:head>
  <title>{article.title} | My Blog</title>
  <meta name="description" content={article.excerpt} />
</svelte:head>

<article class="py-16">
  <div class="container mx-auto px-4">
    <div class="max-w-3xl mx-auto">
      <header class="mb-8">
        {#if article.category}
          <a
            href="/category/{article.category.slug}"
            class="text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline"
          >
            {article.category.name}
          </a>
        {/if}

        <h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-2 mb-4">
          {article.title}
        </h1>

        <div class="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          {#if article.author}
            <div class="flex items-center gap-2">
              {#if article.author.avatar}
                <img
                  src={strapi.getImageUrl(article.author.avatar, "thumbnail")}
                  alt={article.author.name}
                  class="w-8 h-8 rounded-full object-cover"
                />
              {/if}
              <span>{article.author.name}</span>
            </div>
            <span>&middot;</span>
          {/if}
          <time datetime={article.publishedAt}>
            {formatDate(article.publishedAt)}
          </time>
        </div>
      </header>

      {#if article.featuredImage}
        <div class="aspect-video overflow-hidden rounded-xl mb-8">
          <img
            src={strapi.getImageUrl(article.featuredImage, "large")}
            alt={article.featuredImage.alternativeText || article.title}
            class="w-full h-full object-cover"
          />
        </div>
      {/if}

      <div class="prose prose-lg dark:prose-invert max-w-none">
        {@html article.content}
      </div>

      <footer class="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
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

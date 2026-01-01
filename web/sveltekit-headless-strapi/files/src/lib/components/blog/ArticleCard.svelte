<script lang="ts">
  import type { Article } from "$lib/strapi";
  import { strapi } from "$lib/strapi";
  import { formatDate } from "$lib/utils";

  interface Props {
    article: Article;
  }

  let { article }: Props = $props();
</script>

<article class="group">
  <a href="/blog/{article.slug}" class="block">
    <div class="aspect-video overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 mb-4">
      <img
        src={strapi.getImageUrl(article.featuredImage, "medium")}
        alt={article.featuredImage?.alternativeText || article.title}
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
    </div>

    <div class="space-y-2">
      {#if article.category}
        <span class="text-sm font-medium text-brand-600 dark:text-brand-400">
          {article.category.name}
        </span>
      {/if}

      <h2 class="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
        {article.title}
      </h2>

      <p class="text-gray-600 dark:text-gray-400 line-clamp-2">
        {article.excerpt}
      </p>

      <div class="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-500">
        {#if article.author}
          <span>{article.author.name}</span>
          <span>&middot;</span>
        {/if}
        <time datetime={article.publishedAt}>
          {formatDate(article.publishedAt)}
        </time>
      </div>
    </div>
  </a>
</article>

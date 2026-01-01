<script lang="ts">
  import { cn } from "$lib/utils";

  interface Props {
    currentPage: number;
    pageCount: number;
    basePath?: string;
  }

  let { currentPage, pageCount, basePath = "/blog" }: Props = $props();

  const pages = $derived(
    Array.from({ length: pageCount }, (_, i) => i + 1)
  );
</script>

{#if pageCount > 1}
  <nav class="flex items-center justify-center gap-2" aria-label="Pagination">
    <a
      href={currentPage > 1 ? `${basePath}?page=${currentPage - 1}` : undefined}
      class={cn(
        "px-3 py-2 text-sm font-medium rounded-md transition-colors",
        currentPage > 1
          ? "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          : "text-gray-400 dark:text-gray-600 cursor-not-allowed"
      )}
      aria-disabled={currentPage <= 1}
    >
      Previous
    </a>

    {#each pages as page}
      <a
        href={`${basePath}?page=${page}`}
        class={cn(
          "px-3 py-2 text-sm font-medium rounded-md transition-colors",
          page === currentPage
            ? "bg-brand-600 text-white"
            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        )}
        aria-current={page === currentPage ? "page" : undefined}
      >
        {page}
      </a>
    {/each}

    <a
      href={currentPage < pageCount ? `${basePath}?page=${currentPage + 1}` : undefined}
      class={cn(
        "px-3 py-2 text-sm font-medium rounded-md transition-colors",
        currentPage < pageCount
          ? "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          : "text-gray-400 dark:text-gray-600 cursor-not-allowed"
      )}
      aria-disabled={currentPage >= pageCount}
    >
      Next
    </a>
  </nav>
{/if}

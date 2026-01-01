<script lang="ts">
  import { cn } from "$lib/utils";

  interface Props {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    currentCursor?: string;
    basePath?: string;
  }

  let { hasNextPage, hasPreviousPage, currentCursor, basePath = "/blog" }: Props = $props();
</script>

{#if hasNextPage || hasPreviousPage}
  <nav class="flex items-center justify-center gap-4" aria-label="Pagination">
    {#if hasPreviousPage}
      <a
        href={basePath}
        class="px-4 py-2 text-sm font-medium rounded-md transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        Previous
      </a>
    {:else}
      <span class="px-4 py-2 text-sm font-medium text-gray-400 dark:text-gray-600 cursor-not-allowed">
        Previous
      </span>
    {/if}

    {#if hasNextPage}
      <a
        href="{basePath}?after={currentCursor}"
        class="px-4 py-2 text-sm font-medium rounded-md transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        Next
      </a>
    {:else}
      <span class="px-4 py-2 text-sm font-medium text-gray-400 dark:text-gray-600 cursor-not-allowed">
        Next
      </span>
    {/if}
  </nav>
{/if}

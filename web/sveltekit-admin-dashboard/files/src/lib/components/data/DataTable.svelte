<script lang="ts" generics="T">
  import { cn } from "$lib/utils";
  import type { Snippet } from "svelte";

  interface Column<T> {
    key: keyof T | string;
    label: string;
    render?: (item: T) => string;
  }

  interface Props {
    columns: Column<T>[];
    data: T[];
    loading?: boolean;
    emptyMessage?: string;
    class?: string;
    rowKey?: keyof T;
    onRowClick?: (item: T) => void;
  }

  let {
    columns,
    data,
    loading = false,
    emptyMessage = "No data available",
    class: className,
    rowKey,
    onRowClick,
  }: Props = $props();

  function getValue(item: T, key: keyof T | string): unknown {
    if (typeof key === "string" && key.includes(".")) {
      return key.split(".").reduce((obj: any, k) => obj?.[k], item);
    }
    return item[key as keyof T];
  }
</script>

<div class={cn("overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700", className)}>
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
      <thead class="bg-gray-50 dark:bg-gray-800">
        <tr>
          {#each columns as column}
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              {column.label}
            </th>
          {/each}
        </tr>
      </thead>
      <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
        {#if loading}
          <tr>
            <td colspan={columns.length} class="px-6 py-12 text-center">
              <div class="flex items-center justify-center">
                <svg class="animate-spin h-6 w-6 text-brand-500" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            </td>
          </tr>
        {:else if data.length === 0}
          <tr>
            <td colspan={columns.length} class="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
              {emptyMessage}
            </td>
          </tr>
        {:else}
          {#each data as item, i (rowKey ? item[rowKey] : i)}
            <tr
              class={cn(
                "hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
                onRowClick && "cursor-pointer"
              )}
              onclick={() => onRowClick?.(item)}
            >
              {#each columns as column}
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {#if column.render}
                    {column.render(item)}
                  {:else}
                    {getValue(item, column.key)}
                  {/if}
                </td>
              {/each}
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
</div>

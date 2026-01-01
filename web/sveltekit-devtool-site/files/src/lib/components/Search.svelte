<script lang="ts">
  import { onMount } from "svelte";
  import { browser } from "$app/environment";

  let isOpen = $state(false);
  let searchContainer: HTMLDivElement;

  onMount(async () => {
    if (browser) {
      // Load Pagefind UI
      // @ts-expect-error - Pagefind is loaded dynamically
      const pagefind = await import("/pagefind/pagefind-ui.js");
      new pagefind.PagefindUI({
        element: searchContainer,
        showSubResults: true,
        showImages: false,
      });
    }
  });

  function handleKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      isOpen = !isOpen;
    }
    if (e.key === "Escape") {
      isOpen = false;
    }
  }

  function closeOnOutsideClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      isOpen = false;
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<button
  onclick={() => (isOpen = true)}
  class="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-700 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors"
>
  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
  <span class="hidden sm:inline">Search...</span>
  <kbd class="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 rounded">
    <span class="text-xs">⌘</span>K
  </kbd>
</button>

{#if isOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[10vh]"
    onclick={closeOnOutsideClick}
  >
    <div class="w-full max-w-2xl mx-4 bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden">
      <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <span class="font-medium">Search Documentation</span>
        <button
          onclick={() => (isOpen = false)}
          class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div bind:this={searchContainer} class="pagefind-ui p-4"></div>
    </div>
  </div>
{/if}

<style>
  :global(link[href*="pagefind"]) {
    display: none;
  }
</style>

<script lang="ts">
  import { onMount } from "svelte";

  let dialog: HTMLDialogElement;
  let searchInput: HTMLInputElement;
  let pagefindLoaded = $state(false);

  onMount(() => {
    // Handle keyboard shortcut (Cmd+K / Ctrl+K)
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        openSearch();
      }
      if (e.key === "Escape" && dialog?.open) {
        closeSearch();
      }
    };

    document.addEventListener("keydown", handleKeydown);

    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
  });

  async function openSearch() {
    dialog?.showModal();
    searchInput?.focus();

    // Load Pagefind on first open
    if (!pagefindLoaded) {
      try {
        // @ts-expect-error - Pagefind is loaded dynamically
        await import("/pagefind/pagefind.js");
        pagefindLoaded = true;
      } catch {
        console.warn("Pagefind not available. Run build first.");
      }
    }
  }

  function closeSearch() {
    dialog?.close();
  }
</script>

<button
  onclick={openSearch}
  class="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-1.5 text-sm text-zinc-500 hover:border-zinc-300 hover:text-zinc-700"
  aria-label="Search"
>
  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
  <span class="hidden sm:inline">Search</span>
  <kbd class="hidden rounded bg-zinc-100 px-1.5 py-0.5 text-xs sm:inline">⌘K</kbd>
</button>

<dialog
  bind:this={dialog}
  class="w-full max-w-lg rounded-lg border border-zinc-200 p-0 shadow-xl backdrop:bg-black/50"
>
  <div class="p-4">
    <div class="flex items-center gap-3">
      <svg class="h-5 w-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        bind:this={searchInput}
        type="search"
        placeholder="Search..."
        class="flex-1 border-0 bg-transparent text-lg outline-none placeholder:text-zinc-400"
      />
      <button onclick={closeSearch} class="text-sm text-zinc-500 hover:text-zinc-700">
        <kbd class="rounded bg-zinc-100 px-1.5 py-0.5 text-xs">ESC</kbd>
      </button>
    </div>
    <div id="pagefind-results" class="mt-4 max-h-96 overflow-y-auto"></div>
  </div>
</dialog>

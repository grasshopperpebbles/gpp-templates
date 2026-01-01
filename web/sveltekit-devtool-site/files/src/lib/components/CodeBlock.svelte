<script lang="ts">
  import { onMount } from "svelte";
  import { codeToHtml } from "shiki";

  interface Props {
    code: string;
    lang?: string;
    filename?: string;
  }

  let { code, lang = "typescript", filename }: Props = $props();
  let highlightedCode = $state("");
  let copied = $state(false);

  onMount(async () => {
    highlightedCode = await codeToHtml(code, {
      lang,
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
    });
  });

  async function copyCode() {
    await navigator.clipboard.writeText(code);
    copied = true;
    setTimeout(() => {
      copied = false;
    }, 2000);
  }
</script>

<div class="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800">
  {#if filename}
    <div class="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <span class="text-sm text-gray-600 dark:text-gray-400 font-mono">{filename}</span>
    </div>
  {/if}
  <div class="relative">
    {#if highlightedCode}
      {@html highlightedCode}
    {:else}
      <pre class="p-4 bg-gray-50 dark:bg-gray-900"><code>{code}</code></pre>
    {/if}
    <button
      onclick={copyCode}
      class="absolute top-2 right-2 p-2 rounded-md bg-gray-100 dark:bg-gray-800 opacity-0 group-hover:opacity-100 transition-opacity"
      aria-label="Copy code"
    >
      {#if copied}
        <svg class="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      {:else}
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      {/if}
    </button>
  </div>
</div>

<style>
  :global(.shiki) {
    padding: 1rem;
    overflow-x: auto;
    font-size: 0.875rem;
  }

  :global(.dark .shiki),
  :global(.dark .shiki span) {
    color: var(--shiki-dark) !important;
    background-color: transparent !important;
  }

  :global(.shiki),
  :global(.shiki span) {
    color: var(--shiki-light) !important;
    background-color: transparent !important;
  }

  :global(.shiki) {
    background-color: rgb(249 250 251) !important;
  }

  :global(.dark .shiki) {
    background-color: rgb(17 24 39) !important;
  }
</style>

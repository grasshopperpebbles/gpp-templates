<script lang="ts">
  import DocsSidebar from "$lib/components/DocsSidebar.svelte";
  import type { Snippet } from "svelte";

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();
</script>

<div class="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
  <div class="flex gap-8">
    <DocsSidebar />
    <main class="flex-1 min-w-0">
      <article class="prose prose-gray dark:prose-invert max-w-none">
        {@render children()}
      </article>
    </main>
  </div>
</div>

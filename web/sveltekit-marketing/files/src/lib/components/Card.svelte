<script lang="ts">
  import type { Snippet } from "svelte";

  let { children }: { children: Snippet } = $props();
</script>

<div class="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
  {@render children()}
</div>

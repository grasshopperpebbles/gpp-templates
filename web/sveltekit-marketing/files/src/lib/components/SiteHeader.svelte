<script lang="ts">
  import { SITE_NAME } from "$lib/env";
  import Search from "./Search.svelte";
</script>

<header class="border-b border-zinc-200">
  <div class="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
    <a href="/" class="font-semibold">{SITE_NAME}</a>
    <div class="flex items-center gap-6">
      <nav class="flex items-center gap-6 text-sm text-zinc-600">
        <a href="/about" class="hover:text-zinc-900">About</a>
        <a href="/contact" class="hover:text-zinc-900">Contact</a>
      </nav>
      <Search />
    </div>
  </div>
</header>

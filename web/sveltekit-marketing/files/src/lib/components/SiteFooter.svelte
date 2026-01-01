<script lang="ts">
  import { SITE_NAME } from "$lib/env";
</script>

<footer class="mt-auto border-t border-zinc-200 bg-zinc-50">
  <div class="mx-auto flex w-full max-w-5xl flex-col items-center gap-4 px-4 py-8 md:flex-row md:justify-between">
    <p class="text-sm text-zinc-500">
      &copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
    </p>
    <nav class="flex gap-6 text-sm text-zinc-500">
      <a href="/privacy" class="hover:text-zinc-900">Privacy</a>
      <a href="/terms" class="hover:text-zinc-900">Terms</a>
      <a href="/contact" class="hover:text-zinc-900">Contact</a>
    </nav>
  </div>
</footer>

<script lang="ts">
  import { config } from "$lib/config";
</script>

<header class="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
  <div class="container mx-auto px-4">
    <nav class="flex items-center justify-between h-16">
      <a href="/" class="font-bold text-xl text-gray-900 dark:text-white">
        {config.appName}
      </a>

      <div class="flex items-center gap-6">
        <a
          href="/"
          class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          Home
        </a>
        <a
          href="/blog"
          class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          Blog
        </a>
      </div>
    </nav>
  </div>
</header>

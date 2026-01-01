<script lang="ts">
  import { config } from "$lib/config";
</script>

<footer class="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 mt-auto">
  <div class="container mx-auto px-4 py-8">
    <div class="flex flex-col md:flex-row items-center justify-between gap-4">
      <p class="text-gray-600 dark:text-gray-400 text-sm">
        &copy; {new Date().getFullYear()} {config.appName}. All rights reserved.
      </p>
      <div class="flex items-center gap-4">
        <a
          href="/products"
          class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm transition-colors"
        >
          Products
        </a>
        <a
          href="/cart"
          class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm transition-colors"
        >
          Cart
        </a>
      </div>
    </div>
  </div>
</footer>

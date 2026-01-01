<script lang="ts">
  import { config } from "$lib/config";
  import { cart, getCartItemCount } from "$lib/stores/cart";

  const cartCount = $derived(getCartItemCount($cart));
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
          href="/products"
          class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          Products
        </a>
        <a
          href="/cart"
          class="relative text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {#if cartCount > 0}
            <span class="absolute -top-2 -right-2 bg-brand-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {cartCount}
            </span>
          {/if}
        </a>
      </div>
    </nav>
  </div>
</header>

<script lang="ts">
  import { user } from "$lib/stores/auth";
  import { goto } from "$app/navigation";
  import { toggleMode } from "mode-watcher";

  function handleLogout() {
    user.logout();
    goto("/login");
  }
</script>

<header class="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6">
  <div class="flex items-center gap-4">
    <h1 class="text-lg font-semibold">Dashboard</h1>
  </div>
  <div class="flex items-center gap-4">
    <button
      onclick={toggleMode}
      class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      aria-label="Toggle dark mode"
    >
      <svg
        class="w-5 h-5 hidden dark:block"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
      <svg
        class="w-5 h-5 block dark:hidden"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        />
      </svg>
    </button>
    {#if $user}
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-400 font-medium text-sm">
          {$user.name.charAt(0).toUpperCase()}
        </div>
        <div class="hidden sm:block">
          <p class="text-sm font-medium">{$user.name}</p>
          <p class="text-xs text-gray-500">{$user.role}</p>
        </div>
        <button
          onclick={handleLogout}
          class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500"
          aria-label="Logout"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    {/if}
  </div>
</header>

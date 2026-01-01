<script lang="ts">
  import { page } from "$app/stores";
  import { user } from "$lib/stores/auth";
  import { cn } from "$lib/utils";

  interface NavItem {
    href: string;
    label: string;
    icon: string;
  }

  const mainNav: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: "home" },
    { href: "/projects", label: "Projects", icon: "folder" },
    { href: "/analytics", label: "Analytics", icon: "chart" },
  ];

  const adminNav: NavItem[] = [
    { href: "/admin/team", label: "Team", icon: "users" },
    { href: "/admin/billing", label: "Billing", icon: "credit-card" },
  ];

  const settingsNav: NavItem[] = [
    { href: "/settings", label: "Settings", icon: "settings" },
    { href: "/profile", label: "Profile", icon: "user" },
  ];

  function isActive(href: string): boolean {
    if (href === "/dashboard") {
      return $page.url.pathname === "/dashboard";
    }
    return $page.url.pathname.startsWith(href);
  }

  const isAdmin = $derived($user?.role === "admin" || $user?.role === "owner");
</script>

<aside class="fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
  <div class="flex h-16 items-center justify-center border-b border-gray-200 dark:border-gray-700">
    <a href="/dashboard" class="flex items-center gap-2 font-semibold text-lg">
      <svg class="w-8 h-8 text-brand-500" viewBox="0 0 32 32" fill="currentColor">
        <circle cx="16" cy="16" r="12" />
      </svg>
      <span>SaaS App</span>
    </a>
  </div>

  <nav class="flex-1 p-4 space-y-6 overflow-y-auto">
    <div>
      <p class="px-3 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        Main
      </p>
      <div class="space-y-1">
        {#each mainNav as item}
          <a
            href={item.href}
            class={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive(item.href)
                ? "bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-200"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            )}
          >
            {#if item.icon === "home"}
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            {:else if item.icon === "folder"}
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            {:else if item.icon === "chart"}
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            {/if}
            {item.label}
          </a>
        {/each}
      </div>
    </div>

    {#if isAdmin}
      <div>
        <p class="px-3 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Admin
        </p>
        <div class="space-y-1">
          {#each adminNav as item}
            <a
              href={item.href}
              class={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-200"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              )}
            >
              {#if item.icon === "users"}
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              {:else if item.icon === "credit-card"}
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              {/if}
              {item.label}
            </a>
          {/each}
        </div>
      </div>
    {/if}

    <div>
      <p class="px-3 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        Account
      </p>
      <div class="space-y-1">
        {#each settingsNav as item}
          <a
            href={item.href}
            class={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive(item.href)
                ? "bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-200"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            )}
          >
            {#if item.icon === "settings"}
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            {:else if item.icon === "user"}
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            {/if}
            {item.label}
          </a>
        {/each}
      </div>
    </div>
  </nav>
</aside>

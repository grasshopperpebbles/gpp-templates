<script lang="ts">
  import { page } from "$app/stores";
  import { Home, Settings, LayoutDashboard, Wrench } from "lucide-svelte";
  import { cn } from "$lib/utils";

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/tools", label: "Tools", icon: Wrench },
    { href: "/settings", label: "Settings", icon: Settings },
  ];
</script>

<aside class="hidden w-64 border-r bg-muted/40 lg:block">
  <div class="flex h-full flex-col gap-2">
    <div class="flex h-14 items-center border-b px-4">
      <a href="/" class="flex items-center gap-2 font-semibold">
        <span>GPP Web</span>
      </a>
    </div>
    <nav class="flex-1 space-y-1 px-2 py-4">
      {#each navItems as item}
        <a
          href={item.href}
          class={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
            $page.url.pathname === item.href
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <svelte:component this={item.icon} class="h-4 w-4" />
          {item.label}
        </a>
      {/each}
    </nav>
  </div>
</aside>

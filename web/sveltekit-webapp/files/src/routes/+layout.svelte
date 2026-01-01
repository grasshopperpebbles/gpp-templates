<script lang="ts">
  import "../app.css";
  import { ModeWatcher } from "mode-watcher";
  import { Toaster } from "svelte-sonner";
  import Sidebar from "$lib/components/layout/sidebar.svelte";
  import Navbar from "$lib/components/layout/navbar.svelte";
  import type { Snippet } from "svelte";

  let { children }: { children: Snippet } = $props();
  let sidebarOpen = $state(false);
</script>

<ModeWatcher />
<Toaster richColors />

<div class="flex min-h-screen">
  <Sidebar />

  <!-- Mobile sidebar overlay -->
  {#if sidebarOpen}
    <div
      class="fixed inset-0 z-40 bg-black/50 lg:hidden"
      onclick={() => (sidebarOpen = false)}
      onkeydown={(e) => e.key === "Escape" && (sidebarOpen = false)}
      role="button"
      tabindex="0"
    />
  {/if}

  <div class="flex flex-1 flex-col">
    <Navbar onMenuClick={() => (sidebarOpen = !sidebarOpen)} />
    <main class="flex-1 p-4 lg:p-6">
      {@render children()}
    </main>
  </div>
</div>

<script lang="ts">
  import { Menu, Moon, Sun } from "lucide-svelte";
  import Button from "$lib/components/ui/button.svelte";
  import { toggleMode, mode } from "mode-watcher";

  let { onMenuClick }: { onMenuClick?: () => void } = $props();
</script>

<header class="sticky top-0 z-50 flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
  <Button variant="ghost" size="icon" class="lg:hidden" onclick={onMenuClick}>
    <Menu class="h-5 w-5" />
    <span class="sr-only">Toggle menu</span>
  </Button>

  <div class="flex-1" />

  <Button variant="ghost" size="icon" onclick={toggleMode}>
    {#if $mode === "dark"}
      <Sun class="h-5 w-5" />
    {:else}
      <Moon class="h-5 w-5" />
    {/if}
    <span class="sr-only">Toggle theme</span>
  </Button>
</header>

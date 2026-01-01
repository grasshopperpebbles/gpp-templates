<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { user } from "$lib/stores/auth";
  import Sidebar from "$lib/components/layout/Sidebar.svelte";
  import Header from "$lib/components/layout/Header.svelte";
  import type { Snippet } from "svelte";

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();

  onMount(() => {
    if (!$user) {
      goto("/login");
    }
  });
</script>

{#if $user}
  <div class="min-h-screen">
    <Sidebar />
    <div class="pl-64">
      <Header />
      <main class="p-6">
        {@render children()}
      </main>
    </div>
  </div>
{:else}
  <div class="min-h-screen flex items-center justify-center">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
  </div>
{/if}

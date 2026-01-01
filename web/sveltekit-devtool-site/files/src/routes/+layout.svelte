<script lang="ts">
  import { ModeWatcher } from "mode-watcher";
  import Header from "$lib/components/Header.svelte";
  import Footer from "$lib/components/Footer.svelte";
  import "../app.css";

  import type { Snippet } from "svelte";

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();
</script>

<ModeWatcher />

<div class="flex flex-col min-h-screen">
  <Header />
  <main class="flex-1">
    {@render children()}
  </main>
  <Footer />
</div>

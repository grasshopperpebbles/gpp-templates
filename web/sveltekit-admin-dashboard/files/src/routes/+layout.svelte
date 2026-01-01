<script lang="ts">
  import { ModeWatcher } from "mode-watcher";
  import { Toaster } from "svelte-sonner";
  import "../app.css";

  import type { Snippet } from "svelte";

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();
</script>

<ModeWatcher />
<Toaster richColors position="top-right" />

{@render children()}

<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { user } from "$lib/stores/auth";

  onMount(() => {
    if ($user) {
      goto("/admin");
    } else {
      goto("/login");
    }
  });
</script>

<div class="min-h-screen flex items-center justify-center">
  <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
</div>

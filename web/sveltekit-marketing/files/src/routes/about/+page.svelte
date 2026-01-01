<script lang="ts">
  import { SITE_NAME } from "$lib/env";
</script>

<svelte:head>
  <title>About | {SITE_NAME}</title>
  <meta name="description" content="Learn more about {SITE_NAME}" />
</svelte:head>

<div class="space-y-6">
  <h1 class="text-3xl font-semibold tracking-tight">About Us</h1>

  <div class="prose prose-zinc max-w-none">
    <p class="text-lg text-zinc-600">
      Welcome to {SITE_NAME}. We're dedicated to building great products and experiences.
    </p>

    <h2 class="mt-8 text-xl font-medium">Our Mission</h2>
    <p class="text-zinc-600">
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
      incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
      exercitation ullamco laboris.
    </p>

    <h2 class="mt-8 text-xl font-medium">Our Values</h2>
    <ul class="list-disc space-y-2 pl-5 text-zinc-600">
      <li>Quality first in everything we do</li>
      <li>Transparency and honest communication</li>
      <li>Continuous improvement and learning</li>
      <li>Customer success is our success</li>
    </ul>
  </div>
</div>

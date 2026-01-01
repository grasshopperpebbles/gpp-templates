<script lang="ts">
  import { SITE_NAME } from "$lib/env";
  import Card from "$lib/components/Card.svelte";
</script>

<svelte:head>
  <title>{SITE_NAME}</title>
  <meta name="description" content="Welcome to {SITE_NAME}" />
</svelte:head>

<div class="space-y-8">
  <section class="space-y-4">
    <h1 class="text-4xl font-semibold tracking-tight">Welcome to {SITE_NAME}</h1>
    <p class="text-lg text-zinc-600">
      This is a production-ready SvelteKit scaffold intended for GPP projects.
      Customize this page to get started.
    </p>
  </section>

  <div class="grid gap-6 md:grid-cols-2">
    <Card>
      <h2 class="mb-3 text-xl font-medium">Quick Links</h2>
      <ul class="space-y-2 text-sm">
        <li>
          <a href="/about" class="text-blue-600 hover:underline">Learn more about us &rarr;</a>
        </li>
        <li>
          <a href="/contact" class="text-blue-600 hover:underline">Get in touch &rarr;</a>
        </li>
        <li>
          <a href="/privacy" class="text-blue-600 hover:underline">Privacy Policy &rarr;</a>
        </li>
        <li>
          <a href="/terms" class="text-blue-600 hover:underline">Terms of Service &rarr;</a>
        </li>
      </ul>
    </Card>

    <Card>
      <h2 class="mb-3 text-xl font-medium">Next Steps</h2>
      <ul class="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
        <li>Customize the homepage content</li>
        <li>Update about, privacy, and terms pages</li>
        <li>
          Optional: Connect to REST API at
          <code class="rounded bg-zinc-100 px-1">PUBLIC_API_BASE_URL</code>
        </li>
        <li>
          Run: <code class="rounded bg-zinc-100 px-1">pnpm dev</code>
        </li>
      </ul>
    </Card>
  </div>
</div>

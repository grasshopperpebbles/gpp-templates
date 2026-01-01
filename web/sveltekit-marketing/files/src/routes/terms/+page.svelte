<script lang="ts">
  import { SITE_NAME } from "$lib/env";
</script>

<svelte:head>
  <title>Terms of Service | {SITE_NAME}</title>
  <meta name="description" content="Terms of service for {SITE_NAME}" />
</svelte:head>

<div class="space-y-6">
  <h1 class="text-3xl font-semibold tracking-tight">Terms of Service</h1>

  <p class="text-sm text-zinc-500">Last updated: {new Date().toLocaleDateString()}</p>

  <div class="prose prose-zinc max-w-none space-y-6">
    <section>
      <h2 class="text-xl font-medium">1. Acceptance of Terms</h2>
      <p class="text-zinc-600">
        By accessing and using this website, you accept and agree to be bound by the terms
        and provision of this agreement.
      </p>
    </section>

    <section>
      <h2 class="text-xl font-medium">2. Use License</h2>
      <p class="text-zinc-600">
        Permission is granted to temporarily access the materials on this website for personal,
        non-commercial transitory viewing only.
      </p>
    </section>

    <section>
      <h2 class="text-xl font-medium">3. Disclaimer</h2>
      <p class="text-zinc-600">
        The materials on this website are provided on an 'as is' basis. We make no warranties,
        expressed or implied, and hereby disclaim and negate all other warranties.
      </p>
    </section>

    <section>
      <h2 class="text-xl font-medium">4. Limitations</h2>
      <p class="text-zinc-600">
        In no event shall we or our suppliers be liable for any damages arising out of the use
        or inability to use the materials on this website.
      </p>
    </section>

    <section>
      <h2 class="text-xl font-medium">5. Governing Law</h2>
      <p class="text-zinc-600">
        These terms and conditions are governed by and construed in accordance with applicable laws,
        and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
      </p>
    </section>
  </div>
</div>

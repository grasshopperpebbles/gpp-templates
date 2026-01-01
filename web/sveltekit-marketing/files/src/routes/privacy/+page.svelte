<script lang="ts">
  import { SITE_NAME } from "$lib/env";
</script>

<svelte:head>
  <title>Privacy Policy | {SITE_NAME}</title>
  <meta name="description" content="Privacy policy for {SITE_NAME}" />
</svelte:head>

<div class="space-y-6">
  <h1 class="text-3xl font-semibold tracking-tight">Privacy Policy</h1>

  <p class="text-sm text-zinc-500">Last updated: {new Date().toLocaleDateString()}</p>

  <div class="prose prose-zinc max-w-none space-y-6">
    <section>
      <h2 class="text-xl font-medium">1. Information We Collect</h2>
      <p class="text-zinc-600">
        We collect information you provide directly to us, such as when you create an account,
        make a purchase, or contact us for support.
      </p>
    </section>

    <section>
      <h2 class="text-xl font-medium">2. How We Use Your Information</h2>
      <p class="text-zinc-600">
        We use the information we collect to provide, maintain, and improve our services,
        process transactions, and communicate with you.
      </p>
    </section>

    <section>
      <h2 class="text-xl font-medium">3. Information Sharing</h2>
      <p class="text-zinc-600">
        We do not sell, trade, or otherwise transfer your personal information to third parties
        without your consent, except as described in this policy.
      </p>
    </section>

    <section>
      <h2 class="text-xl font-medium">4. Data Security</h2>
      <p class="text-zinc-600">
        We implement appropriate security measures to protect your personal information against
        unauthorized access, alteration, disclosure, or destruction.
      </p>
    </section>

    <section>
      <h2 class="text-xl font-medium">5. Contact Us</h2>
      <p class="text-zinc-600">
        If you have questions about this Privacy Policy, please <a href="/contact" class="text-blue-600 hover:underline">contact us</a>.
      </p>
    </section>
  </div>
</div>

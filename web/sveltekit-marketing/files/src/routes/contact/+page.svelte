<script lang="ts">
  import { SITE_NAME } from "$lib/env";
</script>

<svelte:head>
  <title>Contact | {SITE_NAME}</title>
  <meta name="description" content="Get in touch with {SITE_NAME}" />
</svelte:head>

<div class="space-y-6">
  <h1 class="text-3xl font-semibold tracking-tight">Contact Us</h1>

  <p class="text-lg text-zinc-600">
    Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
  </p>

  <form class="mt-8 max-w-lg space-y-6">
    <div>
      <label for="name" class="block text-sm font-medium text-zinc-700">Name</label>
      <input
        type="text"
        id="name"
        name="name"
        required
        class="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>

    <div>
      <label for="email" class="block text-sm font-medium text-zinc-700">Email</label>
      <input
        type="email"
        id="email"
        name="email"
        required
        class="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>

    <div>
      <label for="message" class="block text-sm font-medium text-zinc-700">Message</label>
      <textarea
        id="message"
        name="message"
        rows="4"
        required
        class="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      ></textarea>
    </div>

    <button
      type="submit"
      class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      Send Message
    </button>
  </form>
</div>

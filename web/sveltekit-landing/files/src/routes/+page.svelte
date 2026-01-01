<script lang="ts">
  const features = [
    {
      title: "Feature One",
      description: "Brief description of the first key feature and its benefits.",
    },
    {
      title: "Feature Two",
      description: "Brief description of the second key feature and its benefits.",
    },
    {
      title: "Feature Three",
      description: "Brief description of the third key feature and its benefits.",
    },
  ];
</script>

<svelte:head>
  <title>Your Product - Landing Page</title>
  <meta name="description" content="A compelling description of your product or service" />
</svelte:head>

<div class="min-h-screen bg-white dark:bg-zinc-950">
  <!-- Hero Section -->
  <section class="relative overflow-hidden">
    <div class="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
      <div class="mx-auto max-w-2xl text-center">
        <h1 class="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-6xl">
          Your Product Headline Goes Here
        </h1>
        <p class="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          A compelling description of your product or service. Explain the value proposition
          and why visitors should take action.
        </p>
        <div class="mt-10 flex items-center justify-center gap-x-6">
          <a
            href="#cta"
            class="rounded-md bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Get Started
          </a>
          <a
            href="#features"
            class="text-sm font-semibold leading-6 text-zinc-900 dark:text-white"
          >
            Learn more <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </div>
    </div>
  </section>

  <!-- Features Section -->
  <section id="features" class="bg-zinc-50 py-24 dark:bg-zinc-900 sm:py-32">
    <div class="mx-auto max-w-7xl px-6 lg:px-8">
      <div class="mx-auto max-w-2xl text-center">
        <h2 class="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
          Key Features
        </h2>
        <p class="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          Everything you need to achieve your goals
        </p>
      </div>
      <div class="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
        <dl class="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
          {#each features as feature}
            <div class="flex flex-col">
              <dt class="text-lg font-semibold leading-7 text-zinc-900 dark:text-white">
                {feature.title}
              </dt>
              <dd class="mt-4 flex flex-auto flex-col text-base leading-7 text-zinc-600 dark:text-zinc-400">
                <p class="flex-auto">{feature.description}</p>
              </dd>
            </div>
          {/each}
        </dl>
      </div>
    </div>
  </section>

  <!-- CTA Section -->
  <section id="cta" class="py-24 sm:py-32">
    <div class="mx-auto max-w-7xl px-6 lg:px-8">
      <div class="mx-auto max-w-2xl text-center">
        <h2 class="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
          Ready to get started?
        </h2>
        <p class="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          Join thousands of satisfied customers today.
        </p>
        <form class="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <input
            type="email"
            placeholder="Enter your email"
            class="w-full max-w-xs rounded-md border border-zinc-300 px-4 py-3 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          />
          <button
            type="submit"
            class="w-full max-w-xs rounded-md bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 sm:w-auto"
          >
            Subscribe
          </button>
        </form>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="border-t border-zinc-200 py-12 dark:border-zinc-800">
    <div class="mx-auto max-w-7xl px-6 lg:px-8">
      <div class="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <p class="text-sm text-zinc-500 dark:text-zinc-400">
          &copy; {new Date().getFullYear()} Your Company. All rights reserved.
        </p>
        <div class="flex gap-6">
          <a
            href="/privacy"
            class="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          >
            Privacy
          </a>
          <a
            href="/terms"
            class="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          >
            Terms
          </a>
        </div>
      </div>
    </div>
  </footer>
</div>

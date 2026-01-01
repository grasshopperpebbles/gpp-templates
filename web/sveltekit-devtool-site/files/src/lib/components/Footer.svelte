<script lang="ts">
  const links = {
    product: [
      { href: "/docs", label: "Documentation" },
      { href: "/docs/api", label: "API Reference" },
      { href: "/docs/examples", label: "Examples" },
      { href: "/changelog", label: "Changelog" },
    ],
    resources: [
      { href: "https://github.com", label: "GitHub" },
      { href: "/docs/contributing", label: "Contributing" },
      { href: "/docs/faq", label: "FAQ" },
    ],
    legal: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  };
</script>

<footer class="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
  <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
      <div class="col-span-2 md:col-span-1">
        <a href="/" class="flex items-center gap-2 font-semibold text-lg mb-4">
          <svg class="w-8 h-8 text-brand-500" viewBox="0 0 32 32" fill="currentColor">
            <rect x="4" y="4" width="24" height="24" rx="4" />
          </svg>
          <span>DevTool</span>
        </a>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Build better software with powerful developer tools.
        </p>
      </div>
      <div>
        <h3 class="font-semibold text-sm mb-4">Product</h3>
        <ul class="space-y-3">
          {#each links.product as link}
            <li>
              <a href={link.href} class="text-sm text-gray-600 dark:text-gray-400 hover:text-brand-500 transition-colors">
                {link.label}
              </a>
            </li>
          {/each}
        </ul>
      </div>
      <div>
        <h3 class="font-semibold text-sm mb-4">Resources</h3>
        <ul class="space-y-3">
          {#each links.resources as link}
            <li>
              <a href={link.href} class="text-sm text-gray-600 dark:text-gray-400 hover:text-brand-500 transition-colors">
                {link.label}
              </a>
            </li>
          {/each}
        </ul>
      </div>
      <div>
        <h3 class="font-semibold text-sm mb-4">Legal</h3>
        <ul class="space-y-3">
          {#each links.legal as link}
            <li>
              <a href={link.href} class="text-sm text-gray-600 dark:text-gray-400 hover:text-brand-500 transition-colors">
                {link.label}
              </a>
            </li>
          {/each}
        </ul>
      </div>
    </div>
    <div class="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 text-center text-sm text-gray-600 dark:text-gray-400">
      <p>&copy; {new Date().getFullYear()} DevTool. All rights reserved.</p>
    </div>
  </div>
</footer>

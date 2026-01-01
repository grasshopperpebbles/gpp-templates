<script lang="ts">
  import { page } from "$app/stores";

  interface NavItem {
    title: string;
    href: string;
  }

  interface NavSection {
    title: string;
    items: NavItem[];
  }

  const navigation: NavSection[] = [
    {
      title: "Getting Started",
      items: [
        { title: "Introduction", href: "/docs" },
        { title: "Installation", href: "/docs/installation" },
        { title: "Quick Start", href: "/docs/quickstart" },
      ],
    },
    {
      title: "Core Concepts",
      items: [
        { title: "Configuration", href: "/docs/configuration" },
        { title: "Commands", href: "/docs/commands" },
        { title: "Plugins", href: "/docs/plugins" },
      ],
    },
    {
      title: "API Reference",
      items: [
        { title: "Overview", href: "/docs/api" },
        { title: "CLI", href: "/docs/api/cli" },
        { title: "JavaScript API", href: "/docs/api/javascript" },
      ],
    },
    {
      title: "Examples",
      items: [
        { title: "Basic Usage", href: "/docs/examples" },
        { title: "Advanced", href: "/docs/examples/advanced" },
        { title: "Integrations", href: "/docs/examples/integrations" },
      ],
    },
  ];

  function isActive(href: string): boolean {
    return $page.url.pathname === href;
  }
</script>

<nav class="w-64 flex-shrink-0 hidden lg:block">
  <div class="sticky top-20 pr-8 pb-8 overflow-y-auto max-h-[calc(100vh-5rem)]">
    {#each navigation as section}
      <div class="mb-8">
        <h3 class="font-semibold text-sm text-gray-900 dark:text-white mb-3">
          {section.title}
        </h3>
        <ul class="space-y-1">
          {#each section.items as item}
            <li>
              <a
                href={item.href}
                class="block py-1.5 px-3 text-sm rounded-md transition-colors {isActive(item.href)
                  ? 'sidebar-link-active'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'}"
              >
                {item.title}
              </a>
            </li>
          {/each}
        </ul>
      </div>
    {/each}
  </div>
</nav>

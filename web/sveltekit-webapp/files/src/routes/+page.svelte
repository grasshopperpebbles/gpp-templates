<script lang="ts">
  import Card from "$lib/components/ui/card.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import { LayoutDashboard, Wrench, Settings, ArrowRight } from "lucide-svelte";

  const quickLinks = [
    {
      title: "Dashboard",
      description: "View your analytics and metrics",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Tools",
      description: "Access your productivity tools",
      href: "/tools",
      icon: Wrench,
    },
    {
      title: "Settings",
      description: "Configure your preferences",
      href: "/settings",
      icon: Settings,
    },
  ];
</script>

<svelte:head>
  <title>Home | GPP Web</title>
</svelte:head>

<div class="space-y-8">
  <div>
    <h1 class="text-3xl font-bold tracking-tight">Welcome to GPP Web</h1>
    <p class="mt-2 text-muted-foreground">
      A production-ready SvelteKit application scaffold. Get started by exploring the features below.
    </p>
  </div>

  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {#each quickLinks as link}
      <Card class="p-6">
        <div class="flex items-start gap-4">
          <div class="rounded-lg bg-primary/10 p-2">
            <svelte:component this={link.icon} class="h-6 w-6 text-primary" />
          </div>
          <div class="flex-1">
            <h3 class="font-semibold">{link.title}</h3>
            <p class="mt-1 text-sm text-muted-foreground">{link.description}</p>
            <a
              href={link.href}
              class="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Go to {link.title}
              <ArrowRight class="h-4 w-4" />
            </a>
          </div>
        </div>
      </Card>
    {/each}
  </div>

  <Card class="p-6">
    <h2 class="text-xl font-semibold">Getting Started</h2>
    <ul class="mt-4 space-y-2 text-sm text-muted-foreground">
      <li>1. Explore the sidebar navigation</li>
      <li>2. Toggle dark mode using the button in the navbar</li>
      <li>3. Check out the form examples in Tools</li>
      <li>4. Configure your preferences in Settings</li>
    </ul>
  </Card>
</div>

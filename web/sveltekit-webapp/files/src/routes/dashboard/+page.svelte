<script lang="ts">
  import Card from "$lib/components/ui/card.svelte";
  import { TrendingUp, Users, Activity, DollarSign } from "lucide-svelte";

  const stats = [
    { title: "Total Revenue", value: "$45,231.89", change: "+20.1%", icon: DollarSign },
    { title: "Active Users", value: "2,350", change: "+15.2%", icon: Users },
    { title: "Sessions", value: "12,543", change: "+8.4%", icon: Activity },
    { title: "Conversion Rate", value: "3.2%", change: "+4.1%", icon: TrendingUp },
  ];
</script>

<svelte:head>
  <title>Dashboard | GPP Web</title>
</svelte:head>

<div class="space-y-8">
  <div>
    <h1 class="text-3xl font-bold tracking-tight">Dashboard</h1>
    <p class="mt-2 text-muted-foreground">
      Overview of your key metrics and performance.
    </p>
  </div>

  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    {#each stats as stat}
      <Card class="p-6">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-muted-foreground">{stat.title}</p>
          <svelte:component this={stat.icon} class="h-4 w-4 text-muted-foreground" />
        </div>
        <div class="mt-2">
          <p class="text-2xl font-bold">{stat.value}</p>
          <p class="text-xs text-green-600">{stat.change} from last month</p>
        </div>
      </Card>
    {/each}
  </div>

  <div class="grid gap-4 lg:grid-cols-2">
    <Card class="p-6">
      <h3 class="font-semibold">Recent Activity</h3>
      <div class="mt-4 space-y-4">
        {#each Array(5) as _, i}
          <div class="flex items-center gap-4">
            <div class="h-2 w-2 rounded-full bg-primary" />
            <div class="flex-1">
              <p class="text-sm">Activity item {i + 1}</p>
              <p class="text-xs text-muted-foreground">2 hours ago</p>
            </div>
          </div>
        {/each}
      </div>
    </Card>

    <Card class="p-6">
      <h3 class="font-semibold">Quick Actions</h3>
      <div class="mt-4 grid gap-2">
        <button class="rounded-lg border p-3 text-left text-sm hover:bg-muted">
          Create new project
        </button>
        <button class="rounded-lg border p-3 text-left text-sm hover:bg-muted">
          Invite team member
        </button>
        <button class="rounded-lg border p-3 text-left text-sm hover:bg-muted">
          Generate report
        </button>
      </div>
    </Card>
  </div>
</div>

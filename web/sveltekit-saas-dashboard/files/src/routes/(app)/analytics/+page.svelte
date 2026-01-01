<script lang="ts">
  import Card from "$lib/components/ui/Card.svelte";
  import StatsCard from "$lib/components/data/StatsCard.svelte";

  const stats = [
    { title: "Total Views", value: 45231, change: 12.5, icon: "growth" as const },
    { title: "Active Users", value: 1234, change: 8.2, icon: "users" as const },
    { title: "Conversion Rate", value: "3.2%", change: 2.1 },
    { title: "Avg. Session", value: "4m 32s", change: 4.3 },
  ];

  const topPages = [
    { page: "Dashboard", views: 15234, percentage: 34 },
    { page: "Projects", views: 8432, percentage: 19 },
    { page: "Settings", views: 5234, percentage: 12 },
    { page: "Team", views: 3421, percentage: 8 },
    { page: "Billing", views: 2876, percentage: 6 },
  ];
</script>

<svelte:head>
  <title>Analytics - SaaS App</title>
</svelte:head>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold">Analytics</h1>
    <p class="text-gray-500 dark:text-gray-400 mt-1">Track your app performance and user engagement</p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {#each stats as stat}
      <StatsCard {...stat} />
    {/each}
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <Card class="p-6">
      <h2 class="text-lg font-semibold mb-4">User Activity</h2>
      <div class="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
        <p>Chart visualization would go here</p>
      </div>
    </Card>

    <Card class="p-6">
      <h2 class="text-lg font-semibold mb-4">Top Pages</h2>
      <div class="space-y-4">
        {#each topPages as page}
          <div class="flex items-center gap-4">
            <div class="flex-1">
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm font-medium">{page.page}</span>
                <span class="text-sm text-gray-500 dark:text-gray-400">{page.views.toLocaleString()} views</span>
              </div>
              <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div class="bg-brand-500 h-2 rounded-full" style="width: {page.percentage}%"></div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </Card>
  </div>
</div>

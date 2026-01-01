<script lang="ts">
  import Card from "$lib/components/ui/Card.svelte";
  import StatsCard from "$lib/components/data/StatsCard.svelte";

  const stats = [
    { title: "Page Views", value: 45231, change: 12.5, icon: "growth" as const },
    { title: "Unique Visitors", value: 12543, change: 8.2, icon: "users" as const },
    { title: "Bounce Rate", value: "32.5%", change: -3.1, icon: "chart" as const },
    { title: "Avg. Session", value: "4m 32s", change: 4.3, icon: "time" as const },
  ];

  const topPages = [
    { page: "/", views: 15234, percentage: 34 },
    { page: "/products", views: 8432, percentage: 19 },
    { page: "/about", views: 5234, percentage: 12 },
    { page: "/contact", views: 3421, percentage: 8 },
    { page: "/blog", views: 2876, percentage: 6 },
  ];

  const sources = [
    { name: "Direct", value: 45, color: "bg-brand-500" },
    { name: "Organic Search", value: 30, color: "bg-green-500" },
    { name: "Social Media", value: 15, color: "bg-purple-500" },
    { name: "Referral", value: 10, color: "bg-orange-500" },
  ];
</script>

<svelte:head>
  <title>Analytics - Admin Dashboard</title>
</svelte:head>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold">Analytics</h1>
    <p class="text-gray-500 dark:text-gray-400 mt-1">Monitor your site performance</p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {#each stats as stat}
      <StatsCard title={stat.title} value={stat.value} change={stat.change} />
    {/each}
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                <div
                  class="bg-brand-500 h-2 rounded-full"
                  style="width: {page.percentage}%"
                ></div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </Card>

    <Card class="p-6">
      <h2 class="text-lg font-semibold mb-4">Traffic Sources</h2>
      <div class="space-y-4">
        {#each sources as source}
          <div class="flex items-center gap-4">
            <div class="w-3 h-3 rounded-full {source.color}"></div>
            <div class="flex-1">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium">{source.name}</span>
                <span class="text-sm text-gray-500 dark:text-gray-400">{source.value}%</span>
              </div>
            </div>
          </div>
        {/each}
      </div>
      <div class="mt-6">
        <div class="flex h-4 rounded-full overflow-hidden">
          {#each sources as source}
            <div class="{source.color}" style="width: {source.value}%"></div>
          {/each}
        </div>
      </div>
    </Card>
  </div>

  <Card class="p-6">
    <h2 class="text-lg font-semibold mb-4">Visitors Over Time</h2>
    <div class="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
      <p>Chart visualization would go here. Consider using Chart.js or similar.</p>
    </div>
  </Card>
</div>

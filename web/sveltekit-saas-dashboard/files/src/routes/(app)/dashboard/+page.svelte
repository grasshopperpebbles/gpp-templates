<script lang="ts">
  import StatsCard from "$lib/components/data/StatsCard.svelte";
  import Card from "$lib/components/ui/Card.svelte";
  import { user } from "$lib/stores/auth";

  const stats = [
    { title: "Total Projects", value: 12, change: 8.2, icon: "projects" as const },
    { title: "Team Members", value: 8, change: 12.5, icon: "users" as const },
    { title: "Active Users", value: 1234, change: 4.3, icon: "growth" as const },
    { title: "Revenue", value: "$12,450", change: 15.8, icon: "revenue" as const },
  ];

  const recentActivity = [
    { action: "New user signed up", time: "5 minutes ago", type: "success" },
    { action: "Project 'Website Redesign' completed", time: "2 hours ago", type: "info" },
    { action: "Invoice #1234 paid", time: "4 hours ago", type: "success" },
    { action: "Team member added", time: "1 day ago", type: "info" },
    { action: "New project created", time: "2 days ago", type: "info" },
  ];
</script>

<svelte:head>
  <title>Dashboard - SaaS App</title>
</svelte:head>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold">Welcome back, {$user?.name}!</h1>
    <p class="text-gray-500 dark:text-gray-400 mt-1">Here's what's happening with your projects today.</p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {#each stats as stat}
      <StatsCard {...stat} />
    {/each}
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <Card class="p-6">
      <h2 class="text-lg font-semibold mb-4">Recent Activity</h2>
      <div class="space-y-4">
        {#each recentActivity as activity}
          <div class="flex items-start gap-3">
            <div class="w-2 h-2 rounded-full mt-2 {activity.type === 'success' ? 'bg-green-500' : 'bg-blue-500'}"></div>
            <div>
              <p class="text-sm">{activity.action}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
            </div>
          </div>
        {/each}
      </div>
    </Card>

    <Card class="p-6">
      <h2 class="text-lg font-semibold mb-4">Quick Actions</h2>
      <div class="grid grid-cols-2 gap-4">
        <a
          href="/projects"
          class="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <svg class="w-6 h-6 text-brand-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <p class="font-medium text-sm">New Project</p>
        </a>
        <a
          href="/admin/team"
          class="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <svg class="w-6 h-6 text-brand-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          <p class="font-medium text-sm">Invite Team</p>
        </a>
        <a
          href="/analytics"
          class="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <svg class="w-6 h-6 text-brand-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p class="font-medium text-sm">View Analytics</p>
        </a>
        <a
          href="/settings"
          class="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <svg class="w-6 h-6 text-brand-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p class="font-medium text-sm">Settings</p>
        </a>
      </div>
    </Card>
  </div>
</div>

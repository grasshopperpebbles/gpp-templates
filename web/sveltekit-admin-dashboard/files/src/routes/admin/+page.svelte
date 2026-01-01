<script lang="ts">
  import StatsCard from "$lib/components/data/StatsCard.svelte";
  import DataTable from "$lib/components/data/DataTable.svelte";
  import Card from "$lib/components/ui/Card.svelte";
  import Badge from "$lib/components/ui/Badge.svelte";
  import { formatDate } from "$lib/utils";

  interface RecentUser {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  }

  const stats = [
    { title: "Total Users", value: 2543, change: 12.5, icon: "users" as const },
    { title: "Revenue", value: "$45,231", change: 8.2, icon: "revenue" as const },
    { title: "Orders", value: 1234, change: -3.1, icon: "orders" as const },
    { title: "Growth", value: "23.5%", change: 4.3, icon: "growth" as const },
  ];

  const recentUsers: RecentUser[] = [
    { id: "1", name: "John Doe", email: "john@example.com", role: "User", createdAt: "2024-01-15" },
    { id: "2", name: "Jane Smith", email: "jane@example.com", role: "Admin", createdAt: "2024-01-14" },
    { id: "3", name: "Bob Wilson", email: "bob@example.com", role: "User", createdAt: "2024-01-13" },
    { id: "4", name: "Alice Brown", email: "alice@example.com", role: "User", createdAt: "2024-01-12" },
    { id: "5", name: "Charlie Davis", email: "charlie@example.com", role: "User", createdAt: "2024-01-11" },
  ];

  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "role", label: "Role" },
    { key: "createdAt", label: "Joined", render: (user: RecentUser) => formatDate(user.createdAt) },
  ];
</script>

<svelte:head>
  <title>Dashboard - Admin</title>
</svelte:head>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold">Dashboard</h1>
    <p class="text-gray-500 dark:text-gray-400 mt-1">Welcome back! Here's what's happening.</p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {#each stats as stat}
      <StatsCard {...stat} />
    {/each}
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <Card class="p-6">
      <h2 class="text-lg font-semibold mb-4">Recent Users</h2>
      <DataTable {columns} data={recentUsers} rowKey="id" />
    </Card>

    <Card class="p-6">
      <h2 class="text-lg font-semibold mb-4">Activity</h2>
      <div class="space-y-4">
        <div class="flex items-start gap-3">
          <div class="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
          <div>
            <p class="text-sm">New user registered: <span class="font-medium">john@example.com</span></p>
            <p class="text-xs text-gray-500 dark:text-gray-400">2 minutes ago</p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <div class="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
          <div>
            <p class="text-sm">Order #1234 completed</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">15 minutes ago</p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <div class="w-2 h-2 rounded-full bg-yellow-500 mt-2"></div>
          <div>
            <p class="text-sm">System backup completed</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">1 hour ago</p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <div class="w-2 h-2 rounded-full bg-purple-500 mt-2"></div>
          <div>
            <p class="text-sm">Settings updated by <span class="font-medium">admin</span></p>
            <p class="text-xs text-gray-500 dark:text-gray-400">3 hours ago</p>
          </div>
        </div>
      </div>
    </Card>
  </div>
</div>

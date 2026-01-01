<script lang="ts">
  import DataTable from "$lib/components/data/DataTable.svelte";
  import Pagination from "$lib/components/data/Pagination.svelte";
  import Card from "$lib/components/ui/Card.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import Input from "$lib/components/ui/Input.svelte";
  import Badge from "$lib/components/ui/Badge.svelte";
  import { formatDate } from "$lib/utils";

  interface User {
    id: string;
    name: string;
    email: string;
    role: "admin" | "user";
    status: "active" | "inactive";
    createdAt: string;
  }

  const allUsers: User[] = [
    { id: "1", name: "John Doe", email: "john@example.com", role: "user", status: "active", createdAt: "2024-01-15" },
    { id: "2", name: "Jane Smith", email: "jane@example.com", role: "admin", status: "active", createdAt: "2024-01-14" },
    { id: "3", name: "Bob Wilson", email: "bob@example.com", role: "user", status: "inactive", createdAt: "2024-01-13" },
    { id: "4", name: "Alice Brown", email: "alice@example.com", role: "user", status: "active", createdAt: "2024-01-12" },
    { id: "5", name: "Charlie Davis", email: "charlie@example.com", role: "user", status: "active", createdAt: "2024-01-11" },
    { id: "6", name: "Diana Miller", email: "diana@example.com", role: "user", status: "active", createdAt: "2024-01-10" },
    { id: "7", name: "Eve Johnson", email: "eve@example.com", role: "admin", status: "active", createdAt: "2024-01-09" },
    { id: "8", name: "Frank Taylor", email: "frank@example.com", role: "user", status: "inactive", createdAt: "2024-01-08" },
  ];

  let search = $state("");
  let currentPage = $state(1);
  const pageSize = 5;

  const filteredUsers = $derived(
    allUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
    )
  );

  const totalPages = $derived(Math.ceil(filteredUsers.length / pageSize));

  const paginatedUsers = $derived(
    filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  );

  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    {
      key: "role",
      label: "Role",
      render: (user: User) => user.role.charAt(0).toUpperCase() + user.role.slice(1),
    },
    {
      key: "status",
      label: "Status",
      render: (user: User) => user.status,
    },
    {
      key: "createdAt",
      label: "Joined",
      render: (user: User) => formatDate(user.createdAt),
    },
  ];

  function handlePageChange(page: number) {
    currentPage = page;
  }
</script>

<svelte:head>
  <title>Users - Admin Dashboard</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold">Users</h1>
      <p class="text-gray-500 dark:text-gray-400 mt-1">Manage user accounts</p>
    </div>
    <Button>Add User</Button>
  </div>

  <Card class="p-6">
    <div class="flex items-center gap-4 mb-6">
      <div class="flex-1 max-w-sm">
        <Input
          type="search"
          placeholder="Search users..."
          bind:value={search}
        />
      </div>
    </div>

    <DataTable {columns} data={paginatedUsers} rowKey="id" />

    {#if totalPages > 1}
      <Pagination {currentPage} {totalPages} onPageChange={handlePageChange} />
    {/if}
  </Card>
</div>

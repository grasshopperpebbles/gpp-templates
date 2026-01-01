<script lang="ts">
  import Card from "$lib/components/ui/Card.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import Badge from "$lib/components/ui/Badge.svelte";
  import { toast } from "svelte-sonner";

  const teamMembers = [
    { id: "1", name: "John Doe", email: "john@example.com", role: "owner", status: "active" },
    { id: "2", name: "Jane Smith", email: "jane@example.com", role: "admin", status: "active" },
    { id: "3", name: "Bob Wilson", email: "bob@example.com", role: "user", status: "active" },
    { id: "4", name: "Alice Brown", email: "alice@example.com", role: "user", status: "pending" },
  ];

  function handleInvite() {
    toast.success("Invitation sent!");
  }

  function handleRemove(name: string) {
    toast.success(`${name} has been removed from the team`);
  }
</script>

<svelte:head>
  <title>Team - SaaS App</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold">Team</h1>
      <p class="text-gray-500 dark:text-gray-400 mt-1">Manage your team members and invitations</p>
    </div>
    <Button onclick={handleInvite}>Invite Member</Button>
  </div>

  <Card class="overflow-hidden">
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Member
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Role
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Status
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {#each teamMembers as member}
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-400 font-medium">
                    {member.name.charAt(0)}
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-medium">{member.name}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">{member.email}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="capitalize">{member.role}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <Badge variant={member.status === "active" ? "success" : "warning"}>
                  {member.status}
                </Badge>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right">
                {#if member.role !== "owner"}
                  <Button variant="ghost" size="sm" onclick={() => handleRemove(member.name)}>
                    Remove
                  </Button>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </Card>
</div>

<script lang="ts">
  import Card from "$lib/components/ui/Card.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import Badge from "$lib/components/ui/Badge.svelte";
  import { formatCurrency, formatDate } from "$lib/utils";
  import { toast } from "svelte-sonner";

  const currentPlan = {
    name: "Pro",
    price: 29,
    interval: "month",
    features: ["Unlimited projects", "Up to 10 team members", "Priority support", "Advanced analytics"],
  };

  const invoices = [
    { id: "INV-001", date: "2024-01-01", amount: 29, status: "paid" },
    { id: "INV-002", date: "2023-12-01", amount: 29, status: "paid" },
    { id: "INV-003", date: "2023-11-01", amount: 29, status: "paid" },
  ];

  function handleUpgrade() {
    toast.success("Redirecting to upgrade page...");
  }

  function handleCancel() {
    toast.error("Subscription cancellation is disabled in demo mode");
  }
</script>

<svelte:head>
  <title>Billing - SaaS App</title>
</svelte:head>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold">Billing</h1>
    <p class="text-gray-500 dark:text-gray-400 mt-1">Manage your subscription and billing information</p>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <Card class="p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold">Current Plan</h2>
        <Badge variant="success">Active</Badge>
      </div>
      <div class="mb-6">
        <p class="text-3xl font-bold">
          {formatCurrency(currentPlan.price)}
          <span class="text-sm font-normal text-gray-500 dark:text-gray-400">/{currentPlan.interval}</span>
        </p>
        <p class="text-lg font-medium mt-1">{currentPlan.name} Plan</p>
      </div>
      <ul class="space-y-2 mb-6">
        {#each currentPlan.features as feature}
          <li class="flex items-center gap-2 text-sm">
            <svg class="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            {feature}
          </li>
        {/each}
      </ul>
      <div class="flex gap-2">
        <Button onclick={handleUpgrade}>Upgrade Plan</Button>
        <Button variant="outline" onclick={handleCancel}>Cancel</Button>
      </div>
    </Card>

    <Card class="p-6">
      <h2 class="text-lg font-semibold mb-4">Payment Method</h2>
      <div class="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg mb-4">
        <div class="w-12 h-8 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
          <svg class="w-8 h-5" viewBox="0 0 32 20" fill="none">
            <rect width="32" height="20" rx="2" fill="#1A1F71"/>
            <text x="16" y="13" font-size="8" fill="white" text-anchor="middle">VISA</text>
          </svg>
        </div>
        <div class="flex-1">
          <p class="font-medium">•••• •••• •••• 4242</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">Expires 12/25</p>
        </div>
      </div>
      <Button variant="outline" class="w-full">Update Payment Method</Button>
    </Card>
  </div>

  <Card class="p-6">
    <h2 class="text-lg font-semibold mb-4">Billing History</h2>
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead>
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Invoice</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
          {#each invoices as invoice}
            <tr>
              <td class="px-4 py-4 text-sm font-medium">{invoice.id}</td>
              <td class="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">{formatDate(invoice.date)}</td>
              <td class="px-4 py-4 text-sm">{formatCurrency(invoice.amount)}</td>
              <td class="px-4 py-4">
                <Badge variant="success">{invoice.status}</Badge>
              </td>
              <td class="px-4 py-4 text-right">
                <Button variant="ghost" size="sm">Download</Button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </Card>
</div>

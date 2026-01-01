<script lang="ts">
  import Card from "$lib/components/ui/Card.svelte";
  import { cn, formatNumber } from "$lib/utils";

  interface Props {
    title: string;
    value: number | string;
    change?: number;
    icon?: "users" | "revenue" | "projects" | "growth";
    class?: string;
  }

  let { title, value, change, icon, class: className }: Props = $props();

  const displayValue = typeof value === "number" ? formatNumber(value) : value;
</script>

<Card class={cn("p-6", className)}>
  <div class="flex items-center justify-between">
    <div>
      <p class="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
      <p class="mt-2 text-3xl font-semibold">{displayValue}</p>
      {#if change !== undefined}
        <p class={cn("mt-1 text-sm", change >= 0 ? "text-green-600" : "text-red-600")}>
          {change >= 0 ? "+" : ""}{change}% from last month
        </p>
      {/if}
    </div>
    {#if icon}
      <div class="p-3 bg-brand-50 dark:bg-brand-900 rounded-lg">
        {#if icon === "users"}
          <svg class="w-6 h-6 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        {:else if icon === "revenue"}
          <svg class="w-6 h-6 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        {:else if icon === "projects"}
          <svg class="w-6 h-6 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        {:else if icon === "growth"}
          <svg class="w-6 h-6 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        {/if}
      </div>
    {/if}
  </div>
</Card>

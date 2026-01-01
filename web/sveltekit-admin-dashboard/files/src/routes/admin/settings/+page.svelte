<script lang="ts">
  import Card from "$lib/components/ui/Card.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import Input from "$lib/components/ui/Input.svelte";
  import { toast } from "svelte-sonner";

  let siteName = $state("Admin Dashboard");
  let siteDescription = $state("A powerful admin dashboard");
  let supportEmail = $state("support@example.com");
  let maintenanceMode = $state(false);
  let saving = $state(false);

  async function handleSave() {
    saving = true;
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    saving = false;
    toast.success("Settings saved successfully");
  }
</script>

<svelte:head>
  <title>Settings - Admin Dashboard</title>
</svelte:head>

<div class="space-y-6 max-w-2xl">
  <div>
    <h1 class="text-2xl font-bold">Settings</h1>
    <p class="text-gray-500 dark:text-gray-400 mt-1">Manage system settings</p>
  </div>

  <Card class="p-6">
    <h2 class="text-lg font-semibold mb-4">General Settings</h2>
    <div class="space-y-4">
      <div>
        <label for="siteName" class="block text-sm font-medium mb-2">Site Name</label>
        <Input id="siteName" bind:value={siteName} />
      </div>
      <div>
        <label for="siteDescription" class="block text-sm font-medium mb-2">Site Description</label>
        <Input id="siteDescription" bind:value={siteDescription} />
      </div>
      <div>
        <label for="supportEmail" class="block text-sm font-medium mb-2">Support Email</label>
        <Input id="supportEmail" type="email" bind:value={supportEmail} />
      </div>
    </div>
  </Card>

  <Card class="p-6">
    <h2 class="text-lg font-semibold mb-4">System</h2>
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="font-medium">Maintenance Mode</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            When enabled, only admins can access the site
          </p>
        </div>
        <button
          class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 {maintenanceMode ? 'bg-brand-600' : 'bg-gray-200 dark:bg-gray-700'}"
          role="switch"
          aria-checked={maintenanceMode}
          onclick={() => (maintenanceMode = !maintenanceMode)}
        >
          <span
            class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {maintenanceMode ? 'translate-x-5' : 'translate-x-0'}"
          ></span>
        </button>
      </div>
    </div>
  </Card>

  <div class="flex justify-end">
    <Button onclick={handleSave} disabled={saving}>
      {#if saving}
        Saving...
      {:else}
        Save Changes
      {/if}
    </Button>
  </div>
</div>

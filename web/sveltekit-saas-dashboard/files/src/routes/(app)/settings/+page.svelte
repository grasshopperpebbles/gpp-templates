<script lang="ts">
  import Card from "$lib/components/ui/Card.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import Input from "$lib/components/ui/Input.svelte";
  import { toast } from "svelte-sonner";

  let notifications = $state(true);
  let emailUpdates = $state(true);
  let saving = $state(false);

  async function handleSave() {
    saving = true;
    await new Promise((resolve) => setTimeout(resolve, 1000));
    saving = false;
    toast.success("Settings saved successfully");
  }
</script>

<svelte:head>
  <title>Settings - SaaS App</title>
</svelte:head>

<div class="space-y-6 max-w-2xl">
  <div>
    <h1 class="text-2xl font-bold">Settings</h1>
    <p class="text-gray-500 dark:text-gray-400 mt-1">Manage your account settings</p>
  </div>

  <Card class="p-6">
    <h2 class="text-lg font-semibold mb-4">Notifications</h2>
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="font-medium">Push Notifications</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">Receive push notifications for important updates</p>
        </div>
        <button
          class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 {notifications ? 'bg-brand-600' : 'bg-gray-200 dark:bg-gray-700'}"
          role="switch"
          aria-checked={notifications}
          onclick={() => (notifications = !notifications)}
        >
          <span class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {notifications ? 'translate-x-5' : 'translate-x-0'}"></span>
        </button>
      </div>
      <div class="flex items-center justify-between">
        <div>
          <p class="font-medium">Email Updates</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">Receive weekly email summaries</p>
        </div>
        <button
          class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 {emailUpdates ? 'bg-brand-600' : 'bg-gray-200 dark:bg-gray-700'}"
          role="switch"
          aria-checked={emailUpdates}
          onclick={() => (emailUpdates = !emailUpdates)}
        >
          <span class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {emailUpdates ? 'translate-x-5' : 'translate-x-0'}"></span>
        </button>
      </div>
    </div>
  </Card>

  <Card class="p-6">
    <h2 class="text-lg font-semibold mb-4">Danger Zone</h2>
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="font-medium text-red-600">Delete Account</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">Permanently delete your account and all data</p>
        </div>
        <Button variant="destructive" onclick={() => toast.error("This is a demo - account deletion disabled")}>
          Delete Account
        </Button>
      </div>
    </div>
  </Card>

  <div class="flex justify-end">
    <Button onclick={handleSave} disabled={saving}>
      {saving ? "Saving..." : "Save Changes"}
    </Button>
  </div>
</div>

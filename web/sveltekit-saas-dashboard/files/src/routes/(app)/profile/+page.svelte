<script lang="ts">
  import Card from "$lib/components/ui/Card.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import Input from "$lib/components/ui/Input.svelte";
  import { user } from "$lib/stores/auth";
  import { toast } from "svelte-sonner";

  let name = $state($user?.name || "");
  let email = $state($user?.email || "");
  let saving = $state(false);

  async function handleSave() {
    saving = true;
    await new Promise((resolve) => setTimeout(resolve, 1000));
    if ($user) {
      user.login({ ...$user, name, email });
    }
    saving = false;
    toast.success("Profile updated successfully");
  }
</script>

<svelte:head>
  <title>Profile - SaaS App</title>
</svelte:head>

<div class="space-y-6 max-w-2xl">
  <div>
    <h1 class="text-2xl font-bold">Profile</h1>
    <p class="text-gray-500 dark:text-gray-400 mt-1">Manage your personal information</p>
  </div>

  <Card class="p-6">
    <div class="flex items-center gap-6 mb-6">
      <div class="w-20 h-20 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-2xl">
        {$user?.name.charAt(0).toUpperCase()}
      </div>
      <div>
        <Button variant="outline">Change Avatar</Button>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">JPG, GIF or PNG. Max size 2MB</p>
      </div>
    </div>

    <div class="space-y-4">
      <div>
        <label for="name" class="block text-sm font-medium mb-2">Full Name</label>
        <Input id="name" bind:value={name} />
      </div>
      <div>
        <label for="email" class="block text-sm font-medium mb-2">Email Address</label>
        <Input id="email" type="email" bind:value={email} />
      </div>
      <div>
        <label class="block text-sm font-medium mb-2">Role</label>
        <Input value={$user?.role || ""} disabled />
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Your role is managed by your team owner</p>
      </div>
    </div>
  </Card>

  <Card class="p-6">
    <h2 class="text-lg font-semibold mb-4">Change Password</h2>
    <div class="space-y-4">
      <div>
        <label for="currentPassword" class="block text-sm font-medium mb-2">Current Password</label>
        <Input id="currentPassword" type="password" placeholder="••••••••" />
      </div>
      <div>
        <label for="newPassword" class="block text-sm font-medium mb-2">New Password</label>
        <Input id="newPassword" type="password" placeholder="••••••••" />
      </div>
      <div>
        <label for="confirmPassword" class="block text-sm font-medium mb-2">Confirm New Password</label>
        <Input id="confirmPassword" type="password" placeholder="••••••••" />
      </div>
    </div>
  </Card>

  <div class="flex justify-end">
    <Button onclick={handleSave} disabled={saving}>
      {saving ? "Saving..." : "Save Changes"}
    </Button>
  </div>
</div>

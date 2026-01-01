<script lang="ts">
  import Card from "$lib/components/ui/card.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Label from "$lib/components/ui/label.svelte";
  import { toast } from "svelte-sonner";

  let settings = $state({
    displayName: "John Doe",
    email: "john@example.com",
    notifications: true,
  });

  function handleSave() {
    toast.success("Settings saved!");
  }
</script>

<svelte:head>
  <title>Settings | GPP Web</title>
</svelte:head>

<div class="space-y-8">
  <div>
    <h1 class="text-3xl font-bold tracking-tight">Settings</h1>
    <p class="mt-2 text-muted-foreground">
      Manage your account settings and preferences.
    </p>
  </div>

  <div class="grid gap-6">
    <Card class="p-6">
      <h2 class="text-lg font-semibold">Profile</h2>
      <p class="mt-1 text-sm text-muted-foreground">
        Update your personal information.
      </p>

      <div class="mt-6 max-w-md space-y-4">
        <div class="space-y-2">
          <Label for="displayName">Display Name</Label>
          <Input id="displayName" bind:value={settings.displayName} />
        </div>

        <div class="space-y-2">
          <Label for="email">Email</Label>
          <Input id="email" type="email" bind:value={settings.email} />
        </div>

        <Button onclick={handleSave}>Save Changes</Button>
      </div>
    </Card>

    <Card class="p-6">
      <h2 class="text-lg font-semibold">Notifications</h2>
      <p class="mt-1 text-sm text-muted-foreground">
        Configure how you receive notifications.
      </p>

      <div class="mt-6 space-y-4">
        <label class="flex items-center gap-3">
          <input
            type="checkbox"
            bind:checked={settings.notifications}
            class="h-4 w-4 rounded border-gray-300"
          />
          <span class="text-sm">Enable email notifications</span>
        </label>
      </div>
    </Card>

    <Card class="p-6">
      <h2 class="text-lg font-semibold text-destructive">Danger Zone</h2>
      <p class="mt-1 text-sm text-muted-foreground">
        Irreversible actions for your account.
      </p>

      <div class="mt-6">
        <Button variant="destructive" onclick={() => toast.error("Account deletion is not implemented in this demo")}>
          Delete Account
        </Button>
      </div>
    </Card>
  </div>
</div>

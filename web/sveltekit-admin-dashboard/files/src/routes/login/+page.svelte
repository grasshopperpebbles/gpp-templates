<script lang="ts">
  import { goto } from "$app/navigation";
  import { user } from "$lib/stores/auth";
  import Button from "$lib/components/ui/Button.svelte";
  import Input from "$lib/components/ui/Input.svelte";
  import Card from "$lib/components/ui/Card.svelte";
  import { toast } from "svelte-sonner";

  let email = $state("");
  let password = $state("");
  let loading = $state(false);

  async function handleSubmit(e: Event) {
    e.preventDefault();
    loading = true;

    try {
      // Demo login - replace with actual API call
      if (email === "admin@example.com" && password === "admin") {
        user.login({
          id: "1",
          email: "admin@example.com",
          name: "Admin User",
          role: "admin",
        });
        toast.success("Welcome back!");
        goto("/admin");
      } else {
        toast.error("Invalid credentials. Try admin@example.com / admin");
      }
    } catch (error) {
      toast.error("Login failed. Please try again.");
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Login - Admin Dashboard</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
  <Card class="w-full max-w-md p-8">
    <div class="text-center mb-8">
      <div class="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-brand-100 dark:bg-brand-900 mb-4">
        <svg class="w-6 h-6 text-brand-600 dark:text-brand-400" viewBox="0 0 24 24" fill="currentColor">
          <rect x="3" y="3" width="18" height="18" rx="3" />
        </svg>
      </div>
      <h1 class="text-2xl font-bold">Admin Dashboard</h1>
      <p class="text-gray-500 dark:text-gray-400 mt-2">Sign in to your account</p>
    </div>

    <form onsubmit={handleSubmit} class="space-y-4">
      <div>
        <label for="email" class="block text-sm font-medium mb-2">Email</label>
        <Input
          id="email"
          type="email"
          placeholder="admin@example.com"
          bind:value={email}
          required
        />
      </div>
      <div>
        <label for="password" class="block text-sm font-medium mb-2">Password</label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          bind:value={password}
          required
        />
      </div>
      <Button type="submit" class="w-full" disabled={loading}>
        {#if loading}
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Signing in...
        {:else}
          Sign in
        {/if}
      </Button>
    </form>

    <p class="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
      Demo: admin@example.com / admin
    </p>
  </Card>
</div>

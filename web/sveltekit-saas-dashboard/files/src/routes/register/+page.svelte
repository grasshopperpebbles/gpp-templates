<script lang="ts">
  import { goto } from "$app/navigation";
  import { user } from "$lib/stores/auth";
  import Button from "$lib/components/ui/Button.svelte";
  import Input from "$lib/components/ui/Input.svelte";
  import Card from "$lib/components/ui/Card.svelte";
  import { toast } from "svelte-sonner";

  let name = $state("");
  let email = $state("");
  let password = $state("");
  let confirmPassword = $state("");
  let loading = $state(false);

  async function handleSubmit(e: Event) {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    loading = true;

    try {
      // Demo registration - replace with actual API call
      user.login({
        id: "1",
        email,
        name,
        role: "owner",
        teamId: "team-new",
      });
      toast.success("Account created successfully!");
      goto("/dashboard");
    } catch (error) {
      toast.error("Registration failed. Please try again.");
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Sign Up - SaaS Dashboard</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
  <Card class="w-full max-w-md p-8">
    <div class="text-center mb-8">
      <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900 mb-4">
        <svg class="w-6 h-6 text-brand-600 dark:text-brand-400" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10" />
        </svg>
      </div>
      <h1 class="text-2xl font-bold">Create an account</h1>
      <p class="text-gray-500 dark:text-gray-400 mt-2">Start your 14-day free trial</p>
    </div>

    <form onsubmit={handleSubmit} class="space-y-4">
      <div>
        <label for="name" class="block text-sm font-medium mb-2">Full Name</label>
        <Input
          id="name"
          type="text"
          placeholder="John Doe"
          bind:value={name}
          required
        />
      </div>
      <div>
        <label for="email" class="block text-sm font-medium mb-2">Email</label>
        <Input
          id="email"
          type="email"
          placeholder="john@example.com"
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
          minlength="8"
        />
      </div>
      <div>
        <label for="confirmPassword" class="block text-sm font-medium mb-2">Confirm Password</label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="••••••••"
          bind:value={confirmPassword}
          required
        />
      </div>
      <Button type="submit" class="w-full" disabled={loading}>
        {#if loading}
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Creating account...
        {:else}
          Create account
        {/if}
      </Button>
    </form>

    <p class="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
      Already have an account?
      <a href="/login" class="text-brand-600 hover:underline">Sign in</a>
    </p>
  </Card>
</div>

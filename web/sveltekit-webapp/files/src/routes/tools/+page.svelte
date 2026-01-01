<script lang="ts">
  import Card from "$lib/components/ui/card.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Label from "$lib/components/ui/label.svelte";
  import { toast } from "svelte-sonner";

  let formData = $state({
    name: "",
    email: "",
    message: "",
  });

  function handleSubmit(e: Event) {
    e.preventDefault();
    toast.success("Form submitted!", {
      description: `Hello ${formData.name}! We received your message.`,
    });
    formData = { name: "", email: "", message: "" };
  }
</script>

<svelte:head>
  <title>Tools | GPP Web</title>
</svelte:head>

<div class="space-y-8">
  <div>
    <h1 class="text-3xl font-bold tracking-tight">Tools</h1>
    <p class="mt-2 text-muted-foreground">
      Example tools and components to help you get started.
    </p>
  </div>

  <div class="grid gap-6 lg:grid-cols-2">
    <Card class="p-6">
      <h2 class="text-lg font-semibold">Example Form</h2>
      <p class="mt-1 text-sm text-muted-foreground">
        A simple form with validation and toast notifications.
      </p>

      <form class="mt-6 space-y-4" onsubmit={handleSubmit}>
        <div class="space-y-2">
          <Label for="name">Name</Label>
          <Input
            id="name"
            placeholder="Your name"
            bind:value={formData.name}
            required
          />
        </div>

        <div class="space-y-2">
          <Label for="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            bind:value={formData.email}
            required
          />
        </div>

        <div class="space-y-2">
          <Label for="message">Message</Label>
          <textarea
            id="message"
            placeholder="Your message..."
            class="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            bind:value={formData.message}
            required
          />
        </div>

        <Button type="submit">Submit</Button>
      </form>
    </Card>

    <Card class="p-6">
      <h2 class="text-lg font-semibold">Toast Examples</h2>
      <p class="mt-1 text-sm text-muted-foreground">
        Click the buttons to see different toast types.
      </p>

      <div class="mt-6 flex flex-wrap gap-2">
        <Button variant="outline" onclick={() => toast.success("Success!")}>
          Success
        </Button>
        <Button variant="outline" onclick={() => toast.error("Error!")}>
          Error
        </Button>
        <Button variant="outline" onclick={() => toast.warning("Warning!")}>
          Warning
        </Button>
        <Button variant="outline" onclick={() => toast.info("Info!")}>
          Info
        </Button>
        <Button
          variant="outline"
          onclick={() =>
            toast.promise(
              new Promise((resolve) => setTimeout(resolve, 2000)),
              {
                loading: "Loading...",
                success: "Done!",
                error: "Error!",
              }
            )}
        >
          Promise
        </Button>
      </div>
    </Card>
  </div>
</div>

<script lang="ts">
  import Card from "$lib/components/ui/Card.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import Badge from "$lib/components/ui/Badge.svelte";
  import { formatDate } from "$lib/utils";
  import { toast } from "svelte-sonner";

  const projects = [
    { id: "1", name: "Website Redesign", status: "active", progress: 75, updatedAt: "2024-01-15" },
    { id: "2", name: "Mobile App", status: "active", progress: 45, updatedAt: "2024-01-14" },
    { id: "3", name: "API Integration", status: "completed", progress: 100, updatedAt: "2024-01-10" },
    { id: "4", name: "Dashboard V2", status: "paused", progress: 30, updatedAt: "2024-01-05" },
  ];

  function handleNewProject() {
    toast.success("Creating new project...");
  }
</script>

<svelte:head>
  <title>Projects - SaaS App</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold">Projects</h1>
      <p class="text-gray-500 dark:text-gray-400 mt-1">Manage your projects and track progress</p>
    </div>
    <Button onclick={handleNewProject}>New Project</Button>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each projects as project}
      <Card class="p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold">{project.name}</h3>
          <Badge variant={project.status === "active" ? "success" : project.status === "completed" ? "default" : "warning"}>
            {project.status}
          </Badge>
        </div>
        <div class="mb-4">
          <div class="flex items-center justify-between text-sm mb-1">
            <span class="text-gray-500 dark:text-gray-400">Progress</span>
            <span>{project.progress}%</span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              class="bg-brand-500 h-2 rounded-full transition-all"
              style="width: {project.progress}%"
            ></div>
          </div>
        </div>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Updated {formatDate(project.updatedAt)}
        </p>
      </Card>
    {/each}

    <button
      onclick={handleNewProject}
      class="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 hover:border-brand-500 hover:text-brand-500 transition-colors"
    >
      <svg class="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
      <span>Create New Project</span>
    </button>
  </div>
</div>

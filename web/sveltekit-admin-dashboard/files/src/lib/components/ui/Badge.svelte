<script lang="ts">
  import { cn } from "$lib/utils";
  import type { Snippet } from "svelte";

  type Variant = "default" | "success" | "warning" | "error" | "outline";

  interface Props {
    variant?: Variant;
    children: Snippet;
    class?: string;
  }

  let { variant = "default", children, class: className }: Props = $props();

  const variants: Record<Variant, string> = {
    default: "bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-200",
    success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    error: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    outline: "border border-gray-300 dark:border-gray-600",
  };
</script>

<span
  class={cn(
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
    variants[variant],
    className
  )}
>
  {@render children()}
</span>

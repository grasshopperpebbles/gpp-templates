<script lang="ts">
  import { page } from '$app/stores';
  import { StoryblokComponent } from '@storyblok/svelte';
  import { getStory } from '$lib/storyblok-client';
  import type { Story } from '@storyblok/svelte';

  let story: Story | null = $state(null);
  let error: Error | null = $state(null);

  $effect(() => {
    const slug = $page.params.slug || 'home';
    getStory(slug)
      .then((data) => {
        story = data;
        error = null;
      })
      .catch((err) => {
        error = err;
        story = null;
      });
  });
</script>

{#if error}
  <div class="container mx-auto py-8 px-4">
    <p>Page not found</p>
  </div>
{:else if story}
  <div class="container mx-auto py-8 px-4">
    <StoryblokComponent blok={story.content} />
  </div>
{:else}
  <div class="container mx-auto py-8 px-4">
    <p>Loading...</p>
  </div>
{/if}


<script lang="ts">
  import { StoryblokComponent } from '@storyblok/svelte';
  import { getStory } from '$lib/storyblok-client';
  import type { Story } from '@storyblok/svelte';

  let story: Story | null = $state(null);

  $effect(() => {
    getStory('home').then((data) => {
      story = data;
    });
  });
</script>

<div class="container mx-auto py-8 px-4">
  {#if story}
    <StoryblokComponent blok={story.content} />
  {:else}
    <p>Loading...</p>
  {/if}
</div>


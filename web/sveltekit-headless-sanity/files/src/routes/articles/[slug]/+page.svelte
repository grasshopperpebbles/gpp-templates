<script lang="ts">
  import { page } from '$app/stores';
  import { sanityClient, postBySlugQuery, urlFor } from '$lib/sanity';
  import { PortableText } from '@portabletext/svelte';
  import type { Post } from '$lib/types/sanity';

  let post: Post | null = $state(null);

  $effect(() => {
    const slug = $page.params.slug;
    sanityClient.fetch(postBySlugQuery(slug)).then((data) => {
      post = data;
    });
  });

  $: imageUrl = post?.mainImage?.asset?.url
    ? urlFor(post.mainImage).width(800).height(400).url()
    : null;
</script>

{#if post}
  <article class="container mx-auto py-8 px-4 max-w-3xl">
    <h1 class="text-4xl font-bold mb-4">{post.title}</h1>
    {#if post.publishedAt}
      <time class="text-gray-500 block mb-6">
        {new Date(post.publishedAt).toLocaleDateString()}
      </time>
    {/if}
    {#if imageUrl}
      <div class="mb-8">
        <img src={imageUrl} alt={post.title} class="rounded-lg w-full" />
      </div>
    {/if}
    {#if post.content}
      <div class="prose prose-lg max-w-none mt-8">
        <PortableText value={post.content} />
      </div>
    {/if}
  </article>
{:else}
  <div class="container mx-auto py-8 px-4">
    <p>Loading...</p>
  </div>
{/if}


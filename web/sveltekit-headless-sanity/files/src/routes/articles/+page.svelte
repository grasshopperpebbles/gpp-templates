<script lang="ts">
  import { sanityClient, postQuery } from '$lib/sanity';
  import type { Post } from '$lib/types/sanity';

  let posts: Post[] = $state([]);

  $effect(() => {
    sanityClient.fetch(postQuery).then((data) => {
      posts = data;
    });
  });
</script>

<div class="container mx-auto py-8 px-4">
  <h1 class="text-3xl font-bold mb-8">Articles</h1>
  <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    {#each posts as post}
      <article class="border rounded-lg p-6 hover:shadow-lg transition-shadow">
        <h2 class="text-xl font-semibold mb-2">
          <a href="/articles/{post.slug.current}" class="hover:underline">
            {post.title}
          </a>
        </h2>
        {#if post.excerpt}
          <p class="text-gray-600 mt-2">{post.excerpt}</p>
        {/if}
        {#if post.publishedAt}
          <time class="text-sm text-gray-400 block mt-4">
            {new Date(post.publishedAt).toLocaleDateString()}
          </time>
        {/if}
      </article>
    {/each}
  </div>
  {#if posts.length === 0}
    <p class="text-gray-500">No articles found.</p>
  {/if}
</div>


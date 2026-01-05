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
  <h1 class="text-4xl font-bold mb-8">Welcome</h1>
  <p class="text-xl text-gray-600 mb-8">
    Latest articles from Sanity CMS
  </p>
  <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    {#each posts.slice(0, 6) as post}
      <article class="border rounded-lg p-6 hover:shadow-lg transition-shadow">
        <h2 class="text-xl font-semibold mb-2">
          <a href="/articles/{post.slug.current}" class="hover:underline">
            {post.title}
          </a>
        </h2>
        {#if post.excerpt}
          <p class="text-gray-600 mt-2 text-sm">{post.excerpt}</p>
        {/if}
      </article>
    {/each}
  </div>
  {#if posts.length > 6}
    <div class="mt-8 text-center">
      <a href="/articles" class="text-blue-600 hover:underline">
        View all articles →
      </a>
    </div>
  {/if}
</div>


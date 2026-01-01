<script lang="ts">
  import Hero from "$lib/components/Hero.svelte";
  import Features from "$lib/components/Features.svelte";
  import CodeBlock from "$lib/components/CodeBlock.svelte";

  const exampleCode = `import { devtool } from 'devtool';

// Initialize with your config
const dt = devtool({
  project: 'my-app',
  environment: 'development',
});

// Use the API
const result = await dt.run('build');
console.log(result);`;
</script>

<svelte:head>
  <title>DevTool - Build better software</title>
  <meta name="description" content="A powerful developer tool that helps you build, test, and deploy your applications with confidence." />
</svelte:head>

<Hero />
<Features />

<section class="py-20">
  <div class="container mx-auto px-4 sm:px-6 lg:px-8">
    <div class="max-w-4xl mx-auto">
      <h2 class="text-3xl font-bold text-center mb-4">Simple, intuitive API</h2>
      <p class="text-lg text-gray-600 dark:text-gray-400 text-center mb-8">
        Get started in minutes with our clean and well-documented API.
      </p>
      <CodeBlock code={exampleCode} lang="typescript" filename="example.ts" />
    </div>
  </div>
</section>

<section class="py-20 bg-brand-500 text-white">
  <div class="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <h2 class="text-3xl font-bold mb-4">Ready to get started?</h2>
    <p class="text-lg text-brand-100 mb-8 max-w-2xl mx-auto">
      Join thousands of developers who are building better software with DevTool.
    </p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <a
        href="/docs"
        class="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-white text-brand-600 font-medium hover:bg-brand-50 transition-colors"
      >
        Read the docs
      </a>
      <a
        href="https://github.com"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center justify-center px-6 py-3 rounded-lg border-2 border-white font-medium hover:bg-white/10 transition-colors"
      >
        Star on GitHub
      </a>
    </div>
  </div>
</section>

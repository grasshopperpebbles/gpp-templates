# SvelteKit Web Application

A full-featured web application template built with SvelteKit, Tailwind CSS, and modern tooling.

## Features

- SvelteKit 2 with Svelte 5
- Tailwind CSS with CSS variables for theming
- Dark mode support (mode-watcher)
- Toast notifications (svelte-sonner)
- Form handling ready (Superforms + Zod available)
- UI components (Button, Card, Input, Label)
- Responsive sidebar navigation
- TypeScript support

## Pages

- `/` - Home page with quick links
- `/dashboard` - Dashboard with stats and activity
- `/tools` - Example forms and toast demos
- `/settings` - User settings page

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Adding More Components

This template includes basic UI components. For more components, consider:

- [Bits UI](https://bits-ui.com/) - Headless Svelte components
- [shadcn-svelte](https://shadcn-svelte.com/) - Port of shadcn/ui

## Form Handling

This template is set up with [Superforms](https://superforms.rocks/) for form handling:

```svelte
<script lang="ts">
  import { superForm } from 'sveltekit-superforms';
  import { zod } from 'sveltekit-superforms/adapters';
  import { z } from 'zod';

  const schema = z.object({
    email: z.string().email(),
  });

  const { form, enhance } = superForm(data.form, {
    validators: zod(schema),
  });
</script>
```

## Environment Variables

Create a `.env` file:

```
PUBLIC_SITE_NAME=GPP Web
PUBLIC_API_BASE_URL=http://localhost:8000
```

## Deployment

This template uses `@sveltejs/adapter-auto` which auto-detects the deployment platform.

For specific platforms:
- Vercel: Works out of the box
- Netlify: Works out of the box
- Node: Use `@sveltejs/adapter-node`
- Static: Use `@sveltejs/adapter-static`

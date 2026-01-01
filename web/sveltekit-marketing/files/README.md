# SvelteKit Marketing Site

A multi-page marketing site template built with SvelteKit, Tailwind CSS, and Pagefind search.

## Features

- SvelteKit 2 with Svelte 5
- Tailwind CSS for styling
- Static site generation
- Pagefind for static search
- TypeScript support
- Responsive design

## Pages

- `/` - Home page
- `/about` - About page
- `/contact` - Contact form
- `/privacy` - Privacy policy
- `/terms` - Terms of service

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

## Environment Variables

Create a `.env` file with:

```
PUBLIC_SITE_NAME=Your Site Name
PUBLIC_SITE_DESCRIPTION=Your site description
PUBLIC_SITE_URL=https://yoursite.dev
PUBLIC_API_BASE_URL=http://localhost:8000
```

## Search

This template uses [Pagefind](https://pagefind.app/) for static search. Search is indexed after build:

```bash
pnpm build  # Runs postbuild automatically
```

Search is available via the search button in the header (Cmd+K / Ctrl+K).

## Deployment

This template uses `@sveltejs/adapter-static` for static site generation. The build output is in the `build/` directory.

Compatible with:
- Vercel
- Netlify
- Cloudflare Pages
- Any static hosting

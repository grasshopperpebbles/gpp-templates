# SvelteKit Landing Page

A single-page landing template for conversion-focused sites, built with SvelteKit and Tailwind CSS.

## Features

- SvelteKit 2 with Svelte 5
- Tailwind CSS with dark mode
- Hero section with CTA
- Features grid
- Email signup form
- Static site generation

## Sections

- Hero with headline and CTAs
- Features grid (3 columns)
- Email signup CTA
- Simple footer

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

## Customization

1. Edit the headline and description in the Hero section
2. Update the features array with your product features
3. Configure the email signup form action
4. Update footer links and company name

## Dark Mode

This template supports dark mode via the `dark` class on the `<html>` element.
You can integrate with system preferences or add a toggle.

## Deployment

This template uses `@sveltejs/adapter-static` for static site generation.
The build output is in the `build/` directory.

Compatible with:
- Vercel
- Netlify
- Cloudflare Pages
- Any static hosting

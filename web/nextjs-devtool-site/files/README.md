# Developer Tool Site

A documentation site built with Next.js, MDX, and Tailwind CSS.

## Features

- **MDX Support** - Write documentation in Markdown with React components
- **Syntax Highlighting** - Code blocks with Shiki
- **Dark Mode** - Automatic dark/light theme switching
- **Responsive Design** - Mobile-friendly documentation
- **Search Ready** - Structured for easy search integration

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
├── app/
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Homepage
│   └── docs/              # Documentation pages (MDX)
├── components/
│   ├── Header.tsx         # Site header
│   ├── Footer.tsx         # Site footer
│   ├── DocsSidebar.tsx    # Documentation navigation
│   └── CodeBlock.tsx      # Syntax-highlighted code
├── public/                # Static assets
└── styles/
    └── globals.css        # Global styles
```

## Writing Documentation

Create MDX files in `app/docs/`:

```mdx
# Page Title

Your content here with **markdown** support.

## Code Examples

\`\`\`typescript
const greeting = "Hello, world!";
\`\`\`
```

## Customization

### Navigation

Edit `components/DocsSidebar.tsx` to modify the documentation navigation.

### Styling

- Global styles in `app/globals.css`
- Tailwind configuration in `tailwind.config.ts`
- Brand colors defined as CSS variables

### Theme

Dark mode is handled by `next-themes`. Toggle component in `components/ThemeToggle.tsx`.

## Deployment

Deploy to Vercel:

```bash
npm run build
vercel --prod
```

Or any platform that supports Next.js.

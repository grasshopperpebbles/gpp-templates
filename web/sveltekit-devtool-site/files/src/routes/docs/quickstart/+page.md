---
layout: docs
---

# Quick Start

Get up and running with DevTool in under 5 minutes.

## Create a New Project

Start by creating a new project:

```bash
devtool init my-project
cd my-project
```

This will create a new directory with the following structure:

```
my-project/
├── src/
│   └── index.ts
├── devtool.config.ts
├── package.json
└── tsconfig.json
```

## Project Structure

- `src/` - Your source code
- `devtool.config.ts` - DevTool configuration file
- `package.json` - Project dependencies and scripts

## Development

Start the development server:

```bash
devtool dev
```

This will:

1. Start the development server
2. Watch for file changes
3. Automatically reload when you make changes

## Building

When you're ready to build for production:

```bash
devtool build
```

Your built files will be in the `dist/` directory.

## Configuration

Customize DevTool by editing `devtool.config.ts`:

```typescript
import { defineConfig } from 'devtool';

export default defineConfig({
  // Project name
  name: 'my-project',

  // Build options
  build: {
    outDir: 'dist',
    minify: true,
  },

  // Development options
  dev: {
    port: 3000,
    open: true,
  },
});
```

## Next Steps

- Learn about [Configuration](/docs/configuration) options
- Explore available [Commands](/docs/commands)
- Add [Plugins](/docs/plugins) to extend functionality

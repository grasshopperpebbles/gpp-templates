---
layout: docs
---

# Configuration

DevTool is highly configurable to fit your project's needs.

## Configuration File

DevTool uses a `devtool.config.ts` (or `.js`, `.mjs`) file in your project root:

```typescript
import { defineConfig } from 'devtool';

export default defineConfig({
  // Your configuration here
});
```

## Options

### name

The name of your project.

```typescript
export default defineConfig({
  name: 'my-awesome-project',
});
```

### root

The root directory of your project. Defaults to the current working directory.

```typescript
export default defineConfig({
  root: './src',
});
```

### build

Build-related options.

```typescript
export default defineConfig({
  build: {
    // Output directory
    outDir: 'dist',

    // Enable minification
    minify: true,

    // Generate source maps
    sourcemap: true,

    // Target environment
    target: 'node18',
  },
});
```

### dev

Development server options.

```typescript
export default defineConfig({
  dev: {
    // Server port
    port: 3000,

    // Host to bind to
    host: 'localhost',

    // Open browser on start
    open: true,

    // Enable HTTPS
    https: false,
  },
});
```

### plugins

Add plugins to extend functionality.

```typescript
import { defineConfig } from 'devtool';
import somePlugin from 'devtool-plugin-example';

export default defineConfig({
  plugins: [
    somePlugin({
      // Plugin options
    }),
  ],
});
```

## Environment Variables

DevTool automatically loads `.env` files:

- `.env` - Loaded in all cases
- `.env.local` - Loaded in all cases, ignored by git
- `.env.[mode]` - Only loaded in specified mode
- `.env.[mode].local` - Only loaded in specified mode, ignored by git

Access environment variables in your config:

```typescript
export default defineConfig({
  build: {
    minify: process.env.NODE_ENV === 'production',
  },
});
```

## TypeScript Support

For TypeScript configuration, DevTool will automatically use your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "strict": true
  }
}
```

## Next Steps

- Explore available [Commands](/docs/commands)
- Learn about [Plugins](/docs/plugins)
- See [API Reference](/docs/api) for programmatic usage

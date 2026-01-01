---
layout: docs
---

# Plugins

Extend DevTool's functionality with plugins.

## Using Plugins

Add plugins to your configuration:

```typescript
// devtool.config.ts
import { defineConfig } from 'devtool';
import myPlugin from 'devtool-plugin-example';

export default defineConfig({
  plugins: [
    myPlugin({
      // Plugin options
    }),
  ],
});
```

## Official Plugins

### @devtool/plugin-typescript

Enhanced TypeScript support:

```bash
npm install @devtool/plugin-typescript
```

```typescript
import typescript from '@devtool/plugin-typescript';

export default defineConfig({
  plugins: [
    typescript({
      strict: true,
      declaration: true,
    }),
  ],
});
```

### @devtool/plugin-css

CSS processing with PostCSS:

```bash
npm install @devtool/plugin-css
```

```typescript
import css from '@devtool/plugin-css';

export default defineConfig({
  plugins: [
    css({
      modules: true,
      autoprefixer: true,
    }),
  ],
});
```

### @devtool/plugin-json

JSON file handling:

```bash
npm install @devtool/plugin-json
```

```typescript
import json from '@devtool/plugin-json';

export default defineConfig({
  plugins: [json()],
});
```

## Creating Plugins

Create your own plugins using the Plugin API:

```typescript
// my-plugin.ts
import { Plugin } from 'devtool';

export default function myPlugin(options = {}): Plugin {
  return {
    name: 'my-plugin',

    // Called when config is resolved
    configResolved(config) {
      console.log('Config:', config);
    },

    // Transform source code
    transform(code, id) {
      if (id.endsWith('.custom')) {
        return {
          code: transformCustomFile(code),
          map: null,
        };
      }
    },

    // Called on build start
    buildStart() {
      console.log('Build starting...');
    },

    // Called on build end
    buildEnd() {
      console.log('Build complete!');
    },
  };
}
```

## Plugin API

### Hooks

| Hook | Description |
|------|-------------|
| `configResolved` | Called after config is resolved |
| `buildStart` | Called when build starts |
| `buildEnd` | Called when build ends |
| `transform` | Transform source code |
| `load` | Custom file loading |
| `resolveId` | Custom module resolution |

### Example: Custom File Type

```typescript
export default function customPlugin(): Plugin {
  return {
    name: 'custom-file-plugin',

    // Handle .custom files
    load(id) {
      if (id.endsWith('.custom')) {
        const content = fs.readFileSync(id, 'utf-8');
        return `export default ${JSON.stringify(content)}`;
      }
    },

    transform(code, id) {
      if (id.endsWith('.custom')) {
        // Transform the loaded content
        return {
          code: processCustomFile(code),
          map: null,
        };
      }
    },
  };
}
```

## Plugin Ordering

Plugins run in order. Use `enforce` to control execution:

```typescript
export default function myPlugin(): Plugin {
  return {
    name: 'my-plugin',
    enforce: 'pre', // Run before other plugins
    // or
    enforce: 'post', // Run after other plugins
  };
}
```

## Next Steps

- [Configuration](/docs/configuration) - Learn all config options
- [API Reference](/docs/api) - Full API documentation
- [Examples](/docs/examples) - See plugins in action

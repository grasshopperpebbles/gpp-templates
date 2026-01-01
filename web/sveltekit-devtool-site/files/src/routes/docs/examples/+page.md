---
layout: docs
---

# Examples

Learn by example with these practical guides.

## Basic Usage

### Hello World

The simplest DevTool project:

```typescript
// src/index.ts
console.log('Hello, DevTool!');
```

```bash
devtool dev
# Output: Hello, DevTool!
```

### With Configuration

A project with custom configuration:

```typescript
// devtool.config.ts
import { defineConfig } from 'devtool';

export default defineConfig({
  name: 'hello-world',
  build: {
    outDir: 'dist',
    minify: true,
  },
});
```

## Web Application

Building a simple web application:

```typescript
// devtool.config.ts
import { defineConfig } from 'devtool';

export default defineConfig({
  name: 'web-app',
  build: {
    target: 'browser',
    outDir: 'public',
  },
  dev: {
    port: 3000,
    open: true,
  },
});
```

```typescript
// src/index.ts
document.getElementById('app')!.innerHTML = `
  <h1>My Web App</h1>
  <p>Built with DevTool</p>
`;
```

## Library

Creating a publishable library:

```typescript
// devtool.config.ts
import { defineConfig } from 'devtool';

export default defineConfig({
  name: 'my-library',
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs'],
    },
    sourcemap: true,
  },
});
```

```typescript
// src/index.ts
export function greet(name: string): string {
  return `Hello, ${name}!`;
}

export function add(a: number, b: number): number {
  return a + b;
}
```

## With Plugins

Using plugins to extend functionality:

```typescript
// devtool.config.ts
import { defineConfig } from 'devtool';
import typescript from 'devtool-plugin-typescript';
import css from 'devtool-plugin-css';

export default defineConfig({
  plugins: [
    typescript({
      strict: true,
    }),
    css({
      modules: true,
    }),
  ],
});
```

## Monorepo

Managing a monorepo with DevTool:

```
my-monorepo/
├── packages/
│   ├── core/
│   │   ├── src/
│   │   └── devtool.config.ts
│   └── cli/
│       ├── src/
│       └── devtool.config.ts
├── devtool.config.ts
└── package.json
```

```typescript
// devtool.config.ts (root)
import { defineConfig } from 'devtool';

export default defineConfig({
  workspaces: ['packages/*'],
});
```

## Next Steps

- [Advanced Examples](/docs/examples/advanced)
- [Integration Examples](/docs/examples/integrations)
- [API Reference](/docs/api)

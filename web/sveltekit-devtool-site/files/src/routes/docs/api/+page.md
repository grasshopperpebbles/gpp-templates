---
layout: docs
---

# API Reference

DevTool provides both a CLI and a JavaScript API for programmatic usage.

## JavaScript API

### createDevTool

Create a new DevTool instance:

```typescript
import { createDevTool } from 'devtool';

const dt = createDevTool({
  root: process.cwd(),
  mode: 'development',
});
```

### build

Programmatically build your project:

```typescript
import { build } from 'devtool';

await build({
  root: './my-project',
  config: {
    build: {
      outDir: 'dist',
      minify: true,
    },
  },
});
```

### createServer

Create a development server:

```typescript
import { createServer } from 'devtool';

const server = await createServer({
  root: process.cwd(),
  server: {
    port: 3000,
  },
});

await server.listen();
console.log('Server running at http://localhost:3000');
```

## Types

### DevToolConfig

```typescript
interface DevToolConfig {
  name?: string;
  root?: string;
  mode?: 'development' | 'production';
  build?: BuildOptions;
  dev?: DevOptions;
  plugins?: Plugin[];
}
```

### BuildOptions

```typescript
interface BuildOptions {
  outDir?: string;
  minify?: boolean;
  sourcemap?: boolean | 'inline' | 'hidden';
  target?: string | string[];
}
```

### DevOptions

```typescript
interface DevOptions {
  port?: number;
  host?: string | boolean;
  open?: boolean | string;
  https?: boolean | HttpsOptions;
}
```

## Events

DevTool emits events during the build process:

```typescript
import { createDevTool } from 'devtool';

const dt = createDevTool();

dt.on('build:start', () => {
  console.log('Build started');
});

dt.on('build:end', (result) => {
  console.log('Build finished:', result);
});

dt.on('error', (error) => {
  console.error('Error:', error);
});
```

## Next Steps

- [CLI Reference](/docs/api/cli) - Command line interface
- [JavaScript API](/docs/api/javascript) - Full API documentation
- [Examples](/docs/examples) - See the API in action

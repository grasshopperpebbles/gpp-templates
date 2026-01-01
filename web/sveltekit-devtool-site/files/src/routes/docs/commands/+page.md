---
layout: docs
---

# Commands

DevTool provides a set of CLI commands for common development tasks.

## devtool init

Initialize a new project:

```bash
devtool init [project-name]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--template <name>` | Use a specific template |
| `--typescript` | Use TypeScript (default) |
| `--javascript` | Use JavaScript instead |

**Examples:**

```bash
# Create a new project
devtool init my-app

# Use a specific template
devtool init my-app --template library

# Create in current directory
devtool init .
```

## devtool dev

Start the development server:

```bash
devtool dev
```

**Options:**

| Option | Description |
|--------|-------------|
| `--port <number>` | Specify port (default: 3000) |
| `--host <host>` | Specify host (default: localhost) |
| `--open` | Open in browser |
| `--https` | Enable HTTPS |

**Examples:**

```bash
# Start on custom port
devtool dev --port 8080

# Open in browser automatically
devtool dev --open

# Bind to all interfaces
devtool dev --host 0.0.0.0
```

## devtool build

Build for production:

```bash
devtool build
```

**Options:**

| Option | Description |
|--------|-------------|
| `--outDir <dir>` | Output directory |
| `--minify` | Enable minification |
| `--sourcemap` | Generate source maps |
| `--watch` | Watch mode |

**Examples:**

```bash
# Build with source maps
devtool build --sourcemap

# Build to custom directory
devtool build --outDir ./output

# Watch mode
devtool build --watch
```

## devtool preview

Preview the production build:

```bash
devtool preview
```

**Options:**

| Option | Description |
|--------|-------------|
| `--port <number>` | Specify port |
| `--host <host>` | Specify host |

## devtool clean

Clean build artifacts:

```bash
devtool clean
```

This removes:
- `dist/` directory
- `node_modules/.cache/`
- Any other generated files

## devtool --help

Show help for any command:

```bash
devtool --help
devtool dev --help
devtool build --help
```

## Next Steps

- Learn about [Plugins](/docs/plugins) to extend commands
- See [Configuration](/docs/configuration) for customization
- Check [API Reference](/docs/api) for programmatic usage

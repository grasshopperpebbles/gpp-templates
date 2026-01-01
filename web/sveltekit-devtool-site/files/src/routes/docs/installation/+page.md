---
layout: docs
---

# Installation

Get DevTool installed on your machine in just a few steps.

## Requirements

Before installing DevTool, make sure you have:

- **Node.js** 18.0 or later
- **npm**, **yarn**, or **pnpm** package manager

## Package Manager Installation

### npm

```bash
npm install -g devtool
```

### yarn

```bash
yarn global add devtool
```

### pnpm

```bash
pnpm add -g devtool
```

## Verify Installation

After installation, verify that DevTool is correctly installed:

```bash
devtool --version
```

You should see output similar to:

```
DevTool v1.0.0
```

## Project-Local Installation

You can also install DevTool as a project dependency:

```bash
npm install devtool --save-dev
```

Then use it via npm scripts or npx:

```bash
npx devtool dev
```

## Updating

To update to the latest version:

```bash
npm update -g devtool
```

## Next Steps

Now that you have DevTool installed, head over to the [Quick Start](/docs/quickstart) guide to create your first project.

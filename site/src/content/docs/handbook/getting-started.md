---
title: Getting Started
description: Install StudioFlow and start building.
sidebar:
  order: 1
---

## Prerequisites

- **Rust** (with cargo) — [Install Rust](https://rustup.rs/)
- **Node.js** (v18+)
- **pnpm** — `npm install -g pnpm`

## Install and run

```bash
git clone https://github.com/mcp-tool-shop-org/studioflow.git
cd studioflow
pnpm install
pnpm dev
```

## Development commands

```bash
pnpm dev          # Launch Tauri dev window
pnpm build        # Build all packages
pnpm test         # Run vitest
pnpm typecheck    # TypeScript check across monorepo
pnpm verify       # typecheck + test in one pass
```

## Monorepo structure

StudioFlow uses pnpm workspaces with three packages:

- `apps/desktop` — Tauri v2 + React desktop application
- `packages/domain` — Pure TypeScript domain types (layer, project, command, viewport)
- `packages/state` — Zustand stores that implement domain behavior

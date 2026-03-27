---
title: Getting Started
description: Install StudioFlow and start building.
sidebar:
  order: 1
---

## Prerequisites

- **Rust** (with cargo) -- [Install Rust](https://rustup.rs/)
- **Node.js** (v18+)
- **pnpm** -- `npm install -g pnpm`

## Install and run

```bash
git clone https://github.com/mcp-tool-shop-org/studioflow.git
cd studioflow
pnpm install
pnpm dev
```

This launches the Tauri v2 desktop window with the full workspace (canvas, layers panel, inspector, toolbar, and project bar).

## Development commands

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Launch Tauri dev window with hot reload |
| `pnpm build` | Build all packages (domain, state, desktop) |
| `pnpm test` | Run Vitest across all packages (236 tests) |
| `pnpm typecheck` | TypeScript check across the monorepo |
| `pnpm verify` | Typecheck + test in one pass |

## Monorepo structure

StudioFlow uses pnpm workspaces with three packages:

| Package | Path | Purpose |
|---------|------|---------|
| Desktop app | `apps/desktop` | Tauri v2 + React desktop application with Rust backend |
| Domain types | `packages/domain` | Pure TypeScript types -- layer, project, command, viewport, history, selection, persistence, workspace, color |
| State stores | `packages/state` | Zustand stores that implement domain behavior -- document, selection, viewport, command, history, persistence, workspace, plus a cross-store dirty tracker |

## Project files

StudioFlow saves projects as `.studioflow` JSON files containing the schema version, project metadata, and layer data. Recent projects are tracked locally and shown in the ProjectBar for quick access.

---
title: Architecture
description: Domain-driven state, monorepo structure, and multi-claude integration.
sidebar:
  order: 2
---

## Stack

- **Tauri v2** — Rust backend, native desktop window
- **React** — UI components (Canvas, Inspector, Toolbar, Workspace)
- **Zustand** — State management with domain-driven stores
- **Vite** — Build tooling
- **Vitest** — Test framework
- **pnpm workspaces** — Monorepo
- **Claude Agent SDK** — Multi-claude orchestration

## Domain layer (`packages/domain`)

Pure TypeScript types with no runtime dependencies:

- `layer.ts` — Layer model (position, size, color, visibility, locking)
- `project.ts` — Project model (layers, metadata, save state)
- `command.ts` — Command pattern for undo/redo
- `viewport.ts` — Zoom, pan, and viewport state
- `history.ts` — Undo/redo stack
- `selection.ts` — Multi-selection model
- `color.ts` — Color representation and conversion

## State layer (`packages/state`)

Zustand stores that implement domain behavior with Immer for immutable updates:

- `documentStore` — Layer CRUD, ordering, property mutations
- `selectionStore` — Single and multi-selection, marquee select
- `viewportStore` — Zoom, pan, viewport commands
- `commandStore` — Command execution and keyboard shortcuts
- `historyStore` — Undo/redo with command pattern
- `persistenceStore` — Project save/load
- `workspaceStore` — Recent projects, workspace state

## Multi-claude architecture

StudioFlow uses the Claude Agent SDK to run independent agent sessions:

- **Builders** execute in isolated git worktrees with full write access
- **Verifiers** run as read-only sessions checking verification points
- **Integrators** merge builder output through a controlled session
- Packets define allowed/forbidden files per role to enforce boundaries

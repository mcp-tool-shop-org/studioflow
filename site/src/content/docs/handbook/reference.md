---
title: Reference
description: Commands, testing, keyboard shortcuts, and multi-claude proof runs.
sidebar:
  order: 3
---

## CLI commands

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Launch Tauri dev window with hot reload |
| `pnpm build` | Build all packages (domain, state, desktop) |
| `pnpm test` | Run Vitest across all packages |
| `pnpm typecheck` | TypeScript check across the monorepo |
| `pnpm verify` | Typecheck + test in one command |

## Keyboard shortcuts

These shortcuts are active when the canvas has focus (not inside text inputs):

| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` | Undo last undoable command |
| `Ctrl+Shift+Z` | Redo |
| `Ctrl+D` | Duplicate selected items (offset +20px each axis) |
| `Ctrl+A` | Select all items on the active layer |
| `Delete` / `Backspace` | Delete selected items |
| `Escape` | Clear selection |
| Arrow keys | Nudge selected items 1px |
| `Shift` + Arrow keys | Nudge selected items 10px |
| Mouse wheel | Zoom in/out |
| Middle-click drag | Pan canvas |
| `Alt` + left-click drag | Pan canvas |
| Left-click drag on empty canvas | Marquee (rubber-band) selection |

## Command types

The command system dispatches 18 typed commands through `commandStore.dispatch()`:

**Layer commands** (undoable): `layer:create`, `layer:rename`, `layer:toggle-visibility`, `layer:toggle-lock`, `layer:delete`, `layer:reorder`

**Item commands** (undoable): `item:add`, `item:move`, `item:resize`, `item:delete`, `item:update`, `item:set-fill`, `item:set-stroke`

**Project commands** (not undoable): `project:new`, `project:save`, `project:save-as`, `project:open`, `project:close`

## Test structure

13 test files with 236 tests across three layers:

### Domain tests (2 files)

- `packages/domain/src/__tests__/types.test.ts` -- Domain type validation and contracts
- `packages/domain/src/__tests__/version.test.ts` -- Schema version constants and guards

### State tests (8 files)

- `packages/state/src/__tests__/documentStore.test.ts` -- Layer and item CRUD
- `packages/state/src/__tests__/selectionStore.test.ts` -- Single/multi/marquee selection
- `packages/state/src/__tests__/viewportStore.test.ts` -- Zoom, pan, fit-to-canvas
- `packages/state/src/__tests__/commandStore.test.ts` -- Command dispatch and routing
- `packages/state/src/__tests__/historyStore.test.ts` -- Undo/redo stack behavior
- `packages/state/src/__tests__/persistenceStore.test.ts` -- Save/load/recent projects
- `packages/state/src/__tests__/workspaceStore.test.ts` -- Panel visibility toggles
- `packages/state/src/__tests__/editing.test.ts` -- End-to-end editing workflows

### Component tests (3 files)

- `apps/desktop/src/components/__tests__/Canvas.test.tsx` -- Canvas rendering, item interaction, viewport
- `apps/desktop/src/components/__tests__/Inspector.test.tsx` -- Property editing, multi-select inspector
- `apps/desktop/src/components/__tests__/Workspace.test.tsx` -- Layout, panel visibility, integration

## Rust backend commands

The Tauri backend registers these `invoke` commands:

| Command | Module | Purpose |
|---------|--------|---------|
| `new_project` | project | Create in-memory project with UUID and timestamps |
| `save_project` | project | Write project JSON to an existing path |
| `save_project_as` | project | Write project JSON to a new path |
| `load_project` | project | Read, parse, and validate a `.studioflow` file |
| `validate_project_file` | project | Validate JSON without touching disk |
| `get_recent_projects` | project | Return recent projects list (max 10, newest first) |
| `add_recent_project` | project | Add/update a recent project entry |
| `create_layer` | layer | Create a new layer with UUID |
| `rename_layer` | layer | Rename a layer by id |
| `toggle_layer_visibility` | layer | Toggle layer visibility flag |
| `delete_layer` | layer | Delete a layer by id |
| `ping` | ping | Health check returning timestamped pong |

## Multi-claude proof runs

### Phase 5 -- Viewport + Multi-Selection

4 builder packets ran in isolated git worktrees across 2 parallel waves. A verifier session checked 20 verification points (19 passed). An integrator merged all builder output through a single controlled session.

### Phase 6 -- Qualified Pass

Proved independent builder and verifier execution under the Claude Agent SDK runtime. Stop-path control was the only unproven element.

See `PHASE-5-CONTRACT.md` and `PHASE-6-POSTMORTEM.md` in the repo root.

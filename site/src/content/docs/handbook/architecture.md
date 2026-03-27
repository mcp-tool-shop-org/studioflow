---
title: Architecture
description: Domain-driven state, monorepo structure, and multi-claude integration.
sidebar:
  order: 2
---

## Stack

- **Tauri v2** -- Rust backend for project persistence, layer operations, and file validation
- **React** -- UI components (Canvas, Inspector, Toolbar, LayersPanel, Workspace, ProjectBar, ColorPicker, RecentProjects)
- **Zustand** -- State management with domain-driven stores (no Immer -- plain spread operators for immutable updates)
- **Vite** -- Build tooling
- **Vitest** -- Test framework (13 test files, 236 tests)
- **pnpm workspaces** -- Monorepo with three packages
- **Claude Agent SDK** -- Multi-claude orchestration

## Domain layer (`packages/domain`)

Pure TypeScript types with no runtime dependencies. Each file defines the shape of one domain concept:

| File | Purpose |
|------|---------|
| `layer.ts` | `Layer` and `LayerItem` models -- type, position, size, rotation, fill/stroke colors, visibility, locking |
| `project.ts` | `Project` metadata -- id, name, timestamps, schema version |
| `command.ts` | `CommandType` enum (18 command types) and `CommandResult` for the dispatch system |
| `viewport.ts` | `ViewportState` (zoom/pan), zoom constants (0.1x -- 5.0x), `ContentBounds` for fit-to-canvas |
| `history.ts` | `HistoryEntry`, `DocumentSnapshot`, undoable vs non-undoable command classification, human-readable labels |
| `selection.ts` | `SelectionMode` (replace/add/toggle), `SelectionRect` for marquee selection, `SelectionBounds` |
| `persistence.ts` | `ProjectFile` schema (version 1), `RecentProject`, `DirtyState`, validation result types |
| `workspace.ts` | `PanelId` (layers/canvas/inspector/toolbar), `PanelVisibility`, `WorkspaceState` |
| `color.ts` | `ColorValue` type (hex strings), default fill (`#2a2a38`) and stroke values |

## State layer (`packages/state`)

Zustand stores that implement domain behavior. Each store is a standalone `create()` call with typed state and actions:

| Store | Responsibility |
|-------|---------------|
| `documentStore` | Layer CRUD, item add/move/resize/delete, fill/stroke color changes |
| `selectionStore` | Single-select, multi-select with modes (replace/add/toggle), marquee `selectByRect`, `selectAll`, `invertSelection`, `getSelectionBounds` |
| `viewportStore` | Zoom in/out/to/reset, pan absolute/relative, `fitToCanvas` with content bounds |
| `commandStore` | Central command dispatcher -- routes 18 command types to the correct store, records history |
| `historyStore` | Undo/redo stack (max 100 entries), document snapshots, saved-state baseline tracking |
| `persistenceStore` | New/save/save-as/open project via Tauri `invoke`, recent projects list, dirty/saving/loading state |
| `workspaceStore` | Panel visibility toggles (layers, canvas, inspector, toolbar), active panel tracking |
| `dirtyTracker` | Cross-store subscriber that marks `persistenceStore` dirty when `documentStore` changes after a project load |

## Rust backend (`apps/desktop/src-tauri`)

The Tauri backend exposes these commands to the frontend via `invoke`:

| Module | Commands |
|--------|----------|
| `commands/project.rs` | `new_project`, `save_project`, `save_project_as`, `load_project`, `validate_project_file`, `get_recent_projects`, `add_recent_project` |
| `commands/layer.rs` | `create_layer`, `rename_layer`, `toggle_layer_visibility`, `delete_layer` |
| `commands/ping.rs` | `ping` -- health check that returns a timestamped pong response |
| `error.rs` | `AppError` struct with code/message/hint shape |

Projects are saved as `.studioflow` JSON files (schema version 1). Recent projects are stored in `%LOCALAPPDATA%/studioflow/recent-projects.json` (max 10 entries).

## React components (`apps/desktop/src`)

| Component | Role |
|-----------|------|
| `Workspace` | Root layout -- arranges Toolbar, LayersPanel, Canvas, and Inspector based on panel visibility |
| `Toolbar` | Main toolbar with panel toggles, New Layer, Undo/Redo, Duplicate/Delete selection actions, keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z, Ctrl+D, Ctrl+A, Delete, arrow nudge) |
| `ProjectBar` | Sub-toolbar for project lifecycle -- New, Open, Save, Save As with dirty indicator |
| `Canvas` | Viewport with zoom/pan transform, item rendering, click-to-select, drag-to-move, wheel zoom, Alt+drag pan, marquee rubber-band selection |
| `LayersPanel` | Layer list with visibility/lock toggles, reorder up/down, inline rename (double-click), delete |
| `Inspector` | Context-sensitive property editor -- layer properties, single-item position/size/rotation/colors, multi-item batch editing with mixed-value indicators |
| `ColorPicker` | Hex color input with "mixed" state for multi-selection |
| `RecentProjects` | Recent project list with inline or modal overlay modes |

## Multi-claude architecture

StudioFlow uses the Claude Agent SDK to run independent agent sessions:

- **Builders** execute in isolated git worktrees with full write access
- **Verifiers** run as read-only sessions checking verification points
- **Integrators** merge builder output through a controlled session
- Packets define allowed/forbidden files per role to enforce boundaries

Phase 5 demonstrated 4 builder packets across 2 parallel waves. Phase 6 proved independent execution under the SDK runtime.

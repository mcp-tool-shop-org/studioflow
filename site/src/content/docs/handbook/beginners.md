---
title: Beginners Guide
description: Step-by-step walkthrough for first-time users and contributors.
sidebar:
  order: 99
---

## 1. What this project does

StudioFlow is a desktop creative workspace for visual editing. You create projects that contain layers, and each layer holds items (shapes, text, images, groups) with position, size, rotation, and color properties. The app runs natively on your desktop through Tauri v2 -- it reads and writes local `.studioflow` project files and does not connect to the internet.

Beyond being a visual editor, StudioFlow serves as a proving ground for multi-claude agent orchestration: independent AI agent sessions building, verifying, and integrating code in isolated git worktrees.

## 2. How to install and run

**Prerequisites:** Rust (with cargo), Node.js v18+, and pnpm.

```bash
# Clone the repository
git clone https://github.com/mcp-tool-shop-org/studioflow.git
cd studioflow

# Install dependencies
pnpm install

# Launch the desktop app in development mode
pnpm dev
```

The `pnpm dev` command starts the Tauri development window with hot reload. You will see the workspace with a toolbar at the top, a layers panel on the left, a canvas in the center, and an inspector panel on the right.

## 3. Key concepts

**Projects** -- A project is a named container saved as a `.studioflow` JSON file. It holds metadata (id, name, timestamps) and all your layers. Use the ProjectBar to create, open, save, and save-as projects.

**Layers** -- Layers organize your canvas items into groups. Each layer has a name, visibility toggle, lock toggle, and sort order. Create layers from the toolbar ("+ New Layer") or the layers panel ("+ Add Layer"). Double-click a layer name to rename it.

**Items** -- Items live inside layers. Each item has a type (shape, text, image, or group), position (x, y), size (width, height), rotation, fill color, and stroke color. Select a layer, then click "+ Add Item" on the canvas to create a shape.

**Commands** -- Every action in StudioFlow goes through the command system. There are 18 command types covering layer operations, item operations, and project lifecycle. Layer and item commands are undoable; project commands are not.

**Undo/Redo** -- The history store keeps up to 100 snapshots. Press Ctrl+Z to undo and Ctrl+Shift+Z to redo. Each undoable command records a full document snapshot before execution, so undo restores the exact previous state.

**Selection modes** -- Clicking an item replaces the current selection. Hold Ctrl and click to toggle items in/out of the selection. Drag on empty canvas for marquee (rubber-band) selection that picks up all items within the rectangle.

**Viewport** -- The canvas supports zoom (0.1x to 5.0x) and pan. Use the mouse wheel to zoom, middle-click drag or Alt+left-click drag to pan, and the toolbar controls to fit content or reset zoom.

## 4. Project structure walkthrough

```
studioflow/
  apps/desktop/               The Tauri v2 desktop application
    src/                      React frontend
      components/             UI components (Canvas, Inspector, Toolbar, etc.)
      styles/                 CSS stylesheets
    src-tauri/                Rust backend
      src/commands/           Tauri invoke commands (project, layer, ping)
  packages/domain/            Pure TypeScript types (no runtime code)
    src/                      Domain models (layer, project, command, etc.)
  packages/state/             Zustand state stores
    src/                      Store implementations + dirty tracker
  site/                       Astro Starlight documentation site
    src/content/docs/         Handbook pages (this site)
```

**Site directory** contains the Astro Starlight documentation site (the handbook you are reading now).

**Domain package** defines the shape of every concept (what a Layer looks like, what commands exist, what a project file contains). It has no dependencies and no side effects.

**State package** implements behavior using Zustand stores. Each store manages one domain area: `documentStore` handles layers and items, `selectionStore` handles what is selected, `viewportStore` handles zoom and pan, and so on. The `commandStore` is the central dispatcher that routes commands to the right store and records history for undo.

**Desktop app** wires React components to the state stores and communicates with the Rust backend through Tauri `invoke` calls for file I/O and project validation.

## 5. Common workflows

### Creating your first project

1. Launch the app with `pnpm dev`
2. Click "New" in the ProjectBar, enter a name
3. Click "+ New Layer" in the toolbar
4. Select the layer in the Layers panel
5. Click "+ Add Item" on the canvas to create a shape
6. Click "Save As" to save your project to disk

### Editing items

- **Select** -- Click an item on the canvas to select it. Hold Ctrl and click for multi-select.
- **Move** -- Drag a selected item to reposition it, or use arrow keys to nudge (1px, or 10px with Shift).
- **Resize** -- Select an item and change Width/Height values in the Inspector panel.
- **Color** -- Use the Fill and Stroke color pickers in the Inspector to change item colors.
- **Delete** -- Press Delete or Backspace, or click "Delete Item" in the Inspector.
- **Duplicate** -- Press Ctrl+D or click "Duplicate" in the toolbar to copy selected items (offset +20px on each axis).

For the full list of keyboard shortcuts, see the [Reference](/studioflow/handbook/reference/) page.

### Managing layers

- **Reorder** -- Use the up/down arrows in the Layers panel to change layer order.
- **Visibility** -- Click the dot icon to hide/show a layer. Hidden layers are not rendered on the canvas.
- **Lock** -- Click the lock icon to prevent edits to a layer. Locked items cannot be selected or moved.
- **Rename** -- Double-click the layer name in the Layers panel to edit it inline.

## 6. Running tests

StudioFlow has 236 tests across 13 test files. Run them with:

```bash
# Run all tests
pnpm test

# Type-check without running tests
pnpm typecheck

# Run both in one pass
pnpm verify
```

Tests are organized in three tiers:

- **Domain tests** (2 files) -- Validate type contracts and schema version constants
- **State tests** (8 files) -- Test every store's actions, edge cases, and cross-store interactions
- **Component tests** (3 files) -- Test React components with simulated user interactions

When contributing, make sure `pnpm verify` passes before pushing. Every code change should include tests for the behavior it touches.

## 7. How to contribute

1. Fork the repository and clone your fork
2. Create a feature branch: `git checkout -b my-feature`
3. Install dependencies: `pnpm install`
4. Make your changes -- follow the existing patterns:
   - New domain concepts go in `packages/domain/src/`
   - New state behavior goes in `packages/state/src/`
   - New UI components go in `apps/desktop/src/components/`
5. Add tests for your changes in the corresponding `__tests__/` directory
6. Run `pnpm verify` to confirm everything passes
7. Commit with a descriptive message and push to your fork
8. Open a pull request against `main`

**Architecture guidelines:**

- Domain types are pure TypeScript with no runtime dependencies
- State stores use Zustand with plain spread operators (no Immer)
- All mutations go through the command system for undo/redo support
- The Rust backend handles file I/O only -- business logic lives in TypeScript
- Components read from stores using Zustand selectors for fine-grained re-renders

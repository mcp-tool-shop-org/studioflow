# StudioFlow Architecture

## 1. What StudioFlow Is

StudioFlow is a desktop creative workspace built on Tauri v2 (Rust backend) and React 18 (frontend), structured as a pnpm monorepo. The application models a layer-based document where users create and manipulate typed items (shapes, text, images, groups) organized into named layers. Phase 1 establishes the domain types, Zustand state architecture, command dispatch system, backend bridge, and panel layout model. No canvas rendering, no file persistence, and no undo/redo exist yet — this is a foundation.

---

## 2. Monorepo Structure

```
studioflow/
├── apps/
│   └── desktop/              # Tauri v2 app (the runnable product)
│       ├── src/              # React frontend
│       ├── src-tauri/        # Rust backend
│       └── package.json      # @studioflow/desktop
├── packages/
│   ├── domain/               # @studioflow/domain — shared TypeScript types only
│   └── state/                # @studioflow/state — Zustand stores
├── package.json              # workspace root (scripts: dev, build, test, typecheck)
├── pnpm-workspace.yaml
└── vitest.config.ts
```

**What each package owns:**

- `packages/domain` — pure TypeScript type definitions. No runtime code, no dependencies outside TypeScript itself. This is the single source of truth for all domain shapes shared across the frontend and backend bridge.
- `packages/state` — Zustand stores. Depends on `@studioflow/domain`. Contains all client-side state and the command dispatch logic. No UI components.
- `apps/desktop` — the Tauri application. Depends on both packages. The Rust side (`src-tauri/`) owns the backend commands. The React side (`src/`) is currently a stub.

---

## 3. Domain Model

Defined in `packages/domain/src/`.

### Project

```ts
interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
}
```

A `Project` is the top-level document container. `schemaVersion` is reserved for future migration handling. `ProjectMeta` is a narrowed pick of `id`, `name`, and `updatedAt` for listing contexts.

### Layer

```ts
interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  order: number;
  items: LayerItem[];
}
```

A `Layer` is an ordered, named container for items. `order` is an integer used to sort layers in the stack. `visible` and `locked` are render/edit hints — enforcing them is the UI's responsibility.

### LayerItem

```ts
interface LayerItem {
  id: string;
  name: string;
  type: LayerItemType;  // 'shape' | 'text' | 'image' | 'group'
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  data: Record<string, unknown>;
}
```

Items are the leaf nodes of the document. The `data` field is an untyped escape hatch for type-specific properties (e.g., fill color for shapes, content for text). Phase 1 does not enforce a schema on `data`.

### Command

```ts
interface Command {
  id: string;
  type: CommandType;
  payload: Record<string, unknown>;
  timestamp: string;
}
```

`CommandType` is a closed union of 8 strings: `layer:create`, `layer:rename`, `layer:toggle-visibility`, `layer:delete`, `item:add`, `item:move`, `item:delete`, `item:update`. Commands are records — they describe intent, not implementation. `CommandResult` carries `{ success, error?, data? }`.

### Workspace

```ts
type PanelId = 'layers' | 'canvas' | 'inspector' | 'toolbar';
type PanelVisibility = Record<PanelId, boolean>;
```

Workspace types define the panel layout vocabulary. These are UI-configuration types, not document types.

---

## 4. Command System

All document mutations flow through a single path:

```
UI component
  └─ useCommandStore().dispatch(type, payload)
       └─ executeCommand(type, payload)
            ├─ useDocumentStore.getState()  → calls layer/item mutations
            └─ useSelectionStore.getState() → available for selection side-effects
                 └─ CommandResult { success, error?, data? } returned
  └─ commandStore appends Command to history, stores lastResult
  └─ Zustand notifies subscribers → UI re-renders
```

`executeCommand` is a private function inside `commandStore.ts`. It is not exported. It reads the current state of `documentStore` and `selectionStore` via `.getState()` (the Zustand escape hatch for reading outside React), applies the mutation, and returns a `CommandResult`.

**Why commands are the only sanctioned mutation path:**

Direct calls to `documentStore` actions are possible (nothing prevents it at runtime), but commands are the only path that:
1. Creates an auditable `Command` record with a stable id and timestamp
2. Centralizes validation (each case branch checks payload shape before acting)
3. Accumulates history in `commandStore.history` — the prerequisite for undo/redo
4. Returns a typed result the caller can inspect

Bypassing `dispatch` produces mutations that are invisible to the history log and cannot be rewound.

---

## 5. State Architecture

Four Zustand stores in `packages/state/src/`. All are module-level singletons created with `create<T>()`. All export a `reset()` action used in tests.

### documentStore

Owns: `project: Project | null`, `layers: Layer[]`, `nextLayerId: number`, `nextItemId: number`.

Actions: `setProject`, `addLayer`, `removeLayer`, `renameLayer`, `toggleLayerVisibility`, `reorderLayer`, `addItem`, `removeItem`, `updateItem`, `moveItem`.

IDs are generated as `layer-{n}` and `item-{n}` using monotonic counters. These are not UUIDs — they are predictable and test-friendly in Phase 1.

### selectionStore

Owns: `selectedLayerId: string | null`, `selectedItemIds: string[]`.

Actions: `selectLayer`, `selectItem`, `selectItems`, `clearSelection`, `toggleItemSelection`.

Selection is decoupled from the document. Deleting a layer does not automatically clear selection — that is a gap to address in Phase 2.

### workspaceStore

Owns: `panels: PanelVisibility`, `activePanel: PanelId | null`.

Actions: `togglePanel`, `setActivePanel`, `showPanel`, `hidePanel`.

All four panels (`layers`, `canvas`, `inspector`, `toolbar`) default to `true` (visible). `activePanel` tracks which panel currently has focus for keyboard routing — it is not wired to any component yet.

### commandStore

Owns: `history: Command[]`, `lastResult: CommandResult | null`.

Actions: `dispatch`, `clearHistory`, `reset`.

This store is the only one that directly depends on the other stores. It reads `documentStore` and `selectionStore` state during `executeCommand`. It does not subscribe to them — it reads on demand at dispatch time.

**Store relationships:**

```
commandStore
  ├─ reads → documentStore (mutations via .getState() actions)
  └─ reads → selectionStore (available for selection side-effects)

workspaceStore     — independent, no cross-store coupling
documentStore      — independent
selectionStore     — independent
```

---

## 6. Backend Bridge

The Tauri v2 `invoke` pattern: TypeScript calls `invoke('command_name', args)` which crosses the IPC boundary and executes a registered `#[tauri::command]` function in Rust. Responses are serialized as JSON.

### Registered commands (`lib.rs`)

All commands are registered in `lib.rs` via `tauri::generate_handler!`. This file is the authoritative registration list — adding a command in Rust requires adding it here.

| Tauri command | Rust fn | Input | Output |
|---|---|---|---|
| `ping` | `commands::ping::ping` | `message: Option<String>` | `PingResponse` |
| `create_layer` | `commands::layer::create_layer` | `name: String` | `LayerResponse` |
| `rename_layer` | `commands::layer::rename_layer` | `id: String, name: String` | `LayerResponse` |
| `toggle_layer_visibility` | `commands::layer::toggle_layer_visibility` | `id: String, visible: bool` | `LayerResponse` |
| `delete_layer` | `commands::layer::delete_layer` | `id: String` | `CommandResponse` |

### Response types (Rust)

```rust
struct PingResponse  { pong: bool, message: String, timestamp: String }
struct LayerResponse { id: String, name: String, visible: bool, locked: bool, order: u32 }
struct CommandResponse { success: bool, message: String }
```

`AppError` (`error.rs`) defines a structured error shape `{ code, message, hint? }` for use when commands return `Result<T, AppError>`. The current layer commands do not yet use `Result` — they return values directly.

### Important limitation

The Rust layer commands are stateless. `create_layer` generates a new UUID and returns a `LayerResponse`, but Rust holds no in-memory layer store. The authoritative state lives entirely in the TypeScript `documentStore`. The backend commands are currently validation/utility functions, not a server-side state owner. A persistent backend state model is a Phase 2 concern.

---

## 7. Panel System

Four panels are defined:

| PanelId | Role |
|---|---|
| `layers` | Layer list, layer management |
| `canvas` | The drawing/editing surface |
| `inspector` | Properties of the selected item/layer |
| `toolbar` | Tool selection and action buttons |

`workspaceStore` controls visibility and active focus for all panels. All default to visible. The panel layout (how they are positioned relative to each other) is not encoded in state — that is a CSS/component concern that does not exist in Phase 1.

`App.tsx` currently renders `<div id="app-root">StudioFlow loading...</div>`. No panel components are wired yet.

---

## 8. Protected Files

| File | Why protected |
|---|---|
| `apps/desktop/src-tauri/src/lib.rs` | Command registration hub. `tauri::generate_handler!` must list every `#[tauri::command]`. Adding or removing a command without updating this file silently breaks the IPC bridge at runtime. |
| `apps/desktop/src/App.tsx` | Root layout mount point. This is the React tree root. Structural changes here affect the entire application shell. |
| `packages/domain/src/index.ts` | Package boundary for `@studioflow/domain`. Anything not exported here is invisible to consumers. Removing an export is a breaking change to all downstream packages. |
| `packages/state/src/index.ts` | Package boundary for `@studioflow/state`. Same contract as domain — the public API surface of the state layer. |

---

## 9. Project Persistence

Phase 2 adds comprehensive file save/load and dirty-state tracking.

### Project File Format

Files are JSON with an explicit three-part structure:

```ts
interface ProjectFile {
  schemaVersion: number;      // For future migration handling
  project: Project;           // Metadata: id, name, createdAt, updatedAt, schemaVersion
  layers: Layer[];            // All layers and their items (flattened by persistence layer)
}
```

`schemaVersion` must be present and match `CURRENT_SCHEMA_VERSION` (1). The Rust backend rejects files with a future schema version. This is not a state dump — it is an intentional serialization contract. `project.schemaVersion` is redundant with the file-level field but kept for consistency with the domain type.

### Persistence Flow

All persistence operations follow a request-response pattern:

```
ProjectBar component
  └─ click "Save" or "Open"
       └─ pickSavePath() or pickOpenPath()  [Tauri dialog plugin]
            └─ persistenceStore.saveProjectAs(path) or openProject(path)
                 └─ buildProjectFile() [reads documentStore.project and .layers]
                 └─ invoke('save_project', { path, data }) [IPC to Rust]
                      └─ write_project_file() [Rust, filesystem write]
                      └─ return PersistenceResponse { success, path?, error? }
                 └─ persistenceStore.setState({ isDirty: false, lastSavedAt, recentProjects })
                 └─ Zustand notifies ProjectBar → UI updates
```

Loading is symmetrical:

```
invoke('load_project', { path })
  └─ load_project() [Rust, filesystem read + parse]
  └─ return ProjectFile { schemaVersion, project, layers }
  └─ persistenceStore._isLoadingProject = true  [flag for dirtyTracker suppression]
  └─ documentStore.setState({ project, layers, ... })
  └─ persistenceStore._isLoadingProject = false
  └─ persistenceStore.setState({ isDirty: false, ... })
```

The backend is stateless — Rust does not own or cache the document. All operations are file I/O and serialization. The frontend (TypeScript) reads and writes the `documentStore` before and after each backend call.

### Dirty State Tracking

`usePersistenceStore` owns three fields:

- `isDirty` — true if any mutation to `documentStore` has occurred since load or save
- `lastSavedAt` — ISO timestamp of last successful save
- `lastModifiedAt` — ISO timestamp of last change (for future conflict detection)

`dirtyTracker.ts` implements the tracking as a Zustand subscriber to `documentStore`:

```ts
useDocumentStore.subscribe((state) => {
  // Skip first call and calls during _isLoadingProject
  if (!initialized || persistenceStore._isLoadingProject) return;

  // Compare project and layers references
  if (state.project !== previousProject || state.layers !== previousLayers) {
    persistenceStore.markDirty();
  }
});
```

The tracker is intentionally NOT a Zustand middleware so it can live outside the store definition. It is initialized by `initDirtyTracker()` (called at app startup) and uses `_isLoadingProject` as a suppression flag — while loading, changes to `documentStore` do not set `isDirty`. This prevents marking the document as dirty immediately after opening a file.

### Recent Projects

The backend maintains a max-10 list of recently opened projects in `~/.local/share/studioflow/recent-projects.json` (or equivalent per-platform app data dir). Each entry is:

```ts
interface RecentProject {
  id: string;
  name: string;
  path: string;
  lastOpenedAt: string;  // ISO timestamp
}
```

When a project is opened or saved, `persistenceStore.saveProjectAs()` and `openProject()` call `addToRecents()`, which:
1. Filters out any existing entry with the same `path` or `id` (deduplication)
2. Prepends the new entry
3. Slices to keep max 20 (slightly higher than the Rust-side max of 10 for safety)

The Rust side also enforces a max 10 cap and sorts by `lastOpenedAt` descending. The frontend can fetch the list via `loadRecentProjects()`, which calls `invoke('get_recent_projects')`.

### Validation

The backend provides two validation paths:

**`load_project(path: String) → LoadProjectResponse`**

Reads a file from disk and parses it. Checks:
- File exists (returns `reason: "FILE_NOT_FOUND"` if not)
- Valid JSON (returns `reason: "INVALID_JSON"` if not)
- Has `schemaVersion` field (returns `reason: "MISSING_SCHEMA_VERSION"` if not)
- Deserializes to `ProjectFile` struct (returns `reason: "SCHEMA_MISMATCH"` if it doesn't)

Errors include a `reason` code for UI handling (e.g., showing appropriate dialogs).

**`validate_project_file(data: String) → ValidationResponse`**

Validates JSON string without touching disk. Collects all errors and warnings:
- Missing `schemaVersion` → error
- `schemaVersion` > `CURRENT_SCHEMA_VERSION` → error
- Missing `project.id` → error
- Missing `project.name` → error
- Missing `layers` field → warning (unusual but not fatal)

Returns `{ valid: bool, errors: Vec, warnings: Vec, schemaVersion? }`.

### What Backend Owns vs Frontend Owns

**Backend (Rust) owns:**
- File I/O (read, write, directory creation)
- JSON serialization and deserialization
- Schema validation (structure, schemaVersion checks)
- Recent projects persistence (file write/read in app data dir)
- Timestamps (using `chrono::Utc::now()`)

**Frontend (TypeScript) owns:**
- State hydration — when a file loads, the frontend decides what calls to make to `documentStore`
- Dirty-state semantics — when to mark dirty, when to suppress marking
- Recent projects UI — which entries to show, what to do when opening
- Command dispatch — all document mutations still go through `commandStore.dispatch()`
- User dialogs — open/save file pickers, error messages, unsaved-changes prompts

This split keeps the backend simple (no in-memory state, no undo/redo knowledge) and the frontend flexible (can load a file and choose to discard it without persisting, can batch mutations before marking clean, etc.).

---

## 10. Command History and Undo/Redo

Undo/redo is a core feature of the command system, implemented via Phase 3's `historyStore`. The system uses snapshot-based history rather than delta-based (inverse commands) because snapshots are simpler to reason about and safe against complex mutations.

### History Model

Each undoable command generates a `HistoryEntry`:

```ts
interface HistoryEntry {
  id: string;
  commandId: string;
  commandType: CommandType;
  label: string;
  timestamp: string;
  beforeSnapshot: DocumentSnapshot;  // State before the command
  undoable: boolean;
}

interface DocumentSnapshot {
  layers: Layer[];
  nextLayerId: number;
  nextItemId: number;
}
```

The `beforeSnapshot` is taken before executing the command. It captures `layers` (deeply cloned), `nextLayerId`, and `nextItemId` — everything needed to restore the document to its pre-command state. Snapshots are created by deep-cloning the layers array via `JSON.parse(JSON.stringify(...))`.

### Undo/Redo Law

`useHistoryStore` maintains two stacks:

- **`past`** — entries that can be undone (most recent last)
- **`future`** — entries that can be redone (most recent first, created by undo)

**Undo operation:**
1. Take a snapshot of the current state (for redo).
2. Pop the last entry from `past`.
3. Restore the document to that entry's `beforeSnapshot`.
4. Push the current snapshot to `future` so redo can restore forward.

**Redo operation:**
1. Take a snapshot of the current state.
2. Pop the first entry from `future`.
3. Restore the document to that entry's `beforeSnapshot` (which is the state after the original command).
4. Push the current snapshot to `past`.

**Clearing redo:** Any new command after an undo clears the entire `future` stack. History does not branch — if you undo three steps and then perform a new action, those three undone commands are discarded.

### What's Undoable

Only document-mutating commands are undoable:

```ts
const UNDOABLE_COMMANDS = [
  'layer:create',
  'layer:rename',
  'layer:toggle-visibility',
  'layer:delete',
  'item:add',
  'item:move',
  'item:delete',
  'item:update',
];
```

Persistence commands are explicitly excluded (not undoable):

```ts
const NON_UNDOABLE_COMMANDS = [
  'project:new',
  'project:save',
  'project:save-as',
  'project:open',
  'project:close',
];
```

This is intentional — saving a project should not create an undo entry. Opening or closing a project resets the history via `clearHistory()`.

### Saved Baseline

`historyStore` also owns `savedSnapshot: DocumentSnapshot | null`. This represents the document state at the last successful save:

- `markSaved()` — called by `persistenceStore` after a successful save. Sets `savedSnapshot` to the current state.
- `isAtSavedState()` — checks if the current document matches `savedSnapshot`. Used by `dirtyTracker` to integrate with `isDirty` logic.

If a user performs mutations and then undoes back to the saved baseline, `isAtSavedState()` returns true and the UI can show the document as clean (not needing save).

### Command Labels

Each command type has a human-readable label for undo/redo UI:

```ts
const COMMAND_LABELS: Record<CommandType, string> = {
  'layer:create': 'Add Layer',
  'layer:rename': 'Rename Layer',
  'layer:toggle-visibility': 'Toggle Layer Visibility',
  'layer:delete': 'Delete Layer',
  'item:add': 'Add Item',
  'item:move': 'Move Item',
  'item:delete': 'Delete Item',
  'item:update': 'Update Item',
  // persistence commands also have labels but are not undoable
  'project:new': 'New Project',
  // ...
};
```

`historyStore` computes `undoLabel` and `redoLabel` from the top of the stacks:

- `undoLabel = canUndo ? `Undo ${lastEntry.label}` : null`
- `redoLabel = canRedo ? `Redo ${lastEntry.label}` : null`

UI buttons/menus can display these labels to show what action will be undone or redone.

### Limits and Performance

- **`MAX_HISTORY = 100`** — when the `past` stack exceeds 100 entries, the oldest entry is discarded (via `shift()`). The `future` stack is unbounded but cleared on any new divergent action.
- **No branching** — redo is linear. Undo three steps, perform a new action, and the three undone commands vanish.
- **Snapshot size** — each snapshot is a full deep clone of the layers array. With complex documents (many layers, many items with large `data` fields), memory usage grows. This is acceptable for Phase 3 but may be optimized in Phase 4 via delta-based snapshots.

### Integration with Command Flow

`commandStore.dispatch()` orchestrates the flow:

```ts
dispatch: (type, payload) => {
  const command = { id, type, payload, timestamp };

  // BEFORE mutating, record the snapshot
  useHistoryStore.getState().recordBeforeCommand(command.id, type, payload);

  // Execute the command (mutates documentStore)
  const result = executeCommand(type, payload);

  // Append to command history
  set((state) => ({
    history: [...state.history, command],
    lastResult: result,
  }));

  return result;
};
```

The key is that `recordBeforeCommand()` is called **before** the command executes. This ensures the snapshot captures the state before the mutation.

### Known Limitations

- **Snapshot-based means memory grows with document complexity.** A document with 100 items and undo depth of 100 will hold ~100 × document size in memory.
- **No partial undo.** Undo/redo are all-or-nothing per command. There is no "undo only this property" within a command.
- **Snapshots include all layers.** If only one item changed, the entire layers array is cloned. Optimizing this (delta-based history) is a Phase 4 concern.

---

## 11. What Is Not Built Yet

The following capabilities are entirely absent from Phase 1 and Phase 3:

- **Canvas rendering** — no drawing surface, no 2D/WebGL renderer, no hit testing. `LayerItem` positions and dimensions exist as data only.
- **Backend state** — Rust commands are stateless. The backend does not own or persist any document state (persistence is write-only).
- **Panel components** — `layers`, `canvas`, `inspector`, and `toolbar` are defined as IDs and visibility flags but no React components implement them.
- **Selection enforcement** — deleting a layer does not clear `selectionStore.selectedLayerId` if it pointed to the deleted layer.
- **Item `data` schema** — the `data: Record<string, unknown>` field on `LayerItem` has no per-type validation or schema.
- **Export** — no image export, no format serialization.
- **Job queue** — no background task system.
- **Auth / multi-user** — out of scope; not planned for Phase 2 either.

---

## 12. Phase 2–4 Attachment Points

| Feature | Where it plugs in | Phase |
|---|---|---|
| Canvas rendering | Mount a renderer inside the `canvas` panel component. It subscribes to `useDocumentStore` for layer/item data and `useSelectionStore` for selection highlights. No state changes needed. | 4 |
| Panel components | Create React components for each `PanelId`. Wire `useWorkspaceStore` to control visibility. `workspaceStore` is already complete. | 2 |
| Selection cleanup on delete | In `commandStore`'s `layer:delete` case, after `doc.removeLayer(layerId)`, call `sel.clearSelection()` if `sel.selectedLayerId === layerId`. | 2 |
| Item `data` schemas | Add per-type interfaces to `packages/domain` (e.g., `ShapeData`, `TextData`). Update `LayerItem` to a discriminated union. This is a breaking domain change. | 2 |
| Backend state ownership | Add an `Arc<Mutex<AppState>>` to the Tauri app state. Pass it via `.manage()` in `lib.rs`. Commands become `async` and take `State<'_, AppState>`. | 2 |
| Structured error handling | Switch layer commands from returning values directly to returning `Result<T, AppError>`. `AppError` is already defined in `error.rs`. | 2 |
| Delta-based snapshots (perf) | Replace `JSON.parse(JSON.stringify(...))` snapshots with a delta representation to reduce memory usage in large documents. Requires a reconciler. | 4 |

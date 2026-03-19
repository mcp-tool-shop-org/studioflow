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

## 9. What Is Not Built Yet

The following capabilities are entirely absent from Phase 1:

- **Persistence** — no file save/load, no SQLite, no local storage. Closing the window loses all state.
- **Undo/redo** — `commandStore.history` accumulates commands but there is no `undo()` action and no snapshot mechanism.
- **Canvas rendering** — no drawing surface, no 2D/WebGL renderer, no hit testing. `LayerItem` positions and dimensions exist as data only.
- **Backend state** — Rust commands are stateless. The backend does not own or persist any document state.
- **Panel components** — `layers`, `canvas`, `inspector`, and `toolbar` are defined as IDs and visibility flags but no React components implement them.
- **Selection enforcement** — deleting a layer does not clear `selectionStore.selectedLayerId` if it pointed to the deleted layer.
- **Item `data` schema** — the `data: Record<string, unknown>` field on `LayerItem` has no per-type validation or schema.
- **Export** — no image export, no format serialization.
- **Job queue** — no background task system.
- **Auth / multi-user** — out of scope; not planned for Phase 2 either.

---

## 10. Phase 2 Attachment Points

| Feature | Where it plugs in |
|---|---|
| Undo/redo | Add `undo()` / `redo()` to `commandStore`. Store snapshots or inverse commands alongside `history`. No other stores need to change. |
| Persistence (save/load) | Add Tauri commands in a new `commands/project.rs`. On load, call `documentStore.setProject()` and reconstruct layers via `documentStore.addLayer()`. Alternatively, replace counter-based IDs with UUIDs to match persisted records. |
| Canvas rendering | Mount a renderer inside the `canvas` panel component. It subscribes to `useDocumentStore` for layer/item data and `useSelectionStore` for selection highlights. No state changes needed. |
| Panel components | Create React components for each `PanelId`. Wire `useWorkspaceStore` to control visibility. `workspaceStore` is already complete. |
| Selection cleanup on delete | In `commandStore`'s `layer:delete` case, after `doc.removeLayer(layerId)`, call `sel.clearSelection()` if `sel.selectedLayerId === layerId`. |
| Item `data` schemas | Add per-type interfaces to `packages/domain` (e.g., `ShapeData`, `TextData`). Update `LayerItem` to a discriminated union. This is a breaking domain change. |
| Backend state ownership | Add an `Arc<Mutex<AppState>>` to the Tauri app state. Pass it via `.manage()` in `lib.rs`. Commands become `async` and take `State<'_, AppState>`. |
| Structured error handling | Switch layer commands from returning values directly to returning `Result<T, AppError>`. `AppError` is already defined in `error.rs`. |

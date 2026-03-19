You are a multi-claude builder worker.

RULES:
- Work in: F:/AI/studioflow/.multi-claude/worktrees/sf5-104
- Do NOT modify forbidden files
- Stay within allowed files

YOUR PACKET:
# SF5-104 — Command Surface + Inspector

**Role:** builder
**Depends on:** SF5-102 (multi-selection)
**Goal:** Add keyboard shortcuts, batch actions, and multi-select inspector.

## What to build

1. Modify `apps/desktop/src/components/Inspector.tsx`:
   - When multiple items selected: show count, shared properties, mixed-state indicators
   - Mixed values shown as "—" or "mixed" placeholder
   - Batch property edit: changing a value applies to ALL selected items via dispatch loop
   - "Duplicate Selected" button: dispatches item:add for each selected item with offset position
   - "Delete Selected" button: dispatches item:delete for each selected item
   - "Nudge" controls: arrow buttons that dispatch item:move with +/-10px offset for all selected

2. Modify `apps/desktop/src/components/Toolbar.tsx`:
   - Add keyboard shortcut handler (useEffect with keydown):
     - Delete/Backspace: delete selected items
     - Ctrl+D: duplicate selected items
     - Ctrl+A: select all items on active layer
     - Arrow keys: nudge selected items by 1px (10px with Shift)
     - Escape: clear selection
   - Add visible shortcut hint buttons where useful

3. Modify `apps/desktop/src/styles/workspace.css`:
   - Multi-select inspector styles: mixed value indicator, batch action buttons
   - Shortcut hint badge styles

4. Create `apps/desktop/src/components/__tests__/Inspector.test.tsx`:
   - At least 8 tests: empty state, single item edit, multi-select shows count, mixed values display, delete dispatches for all selected, duplicate creates copies, nudge moves all selected

## Allowed files
- apps/desktop/src/components/Inspector.tsx
- apps/desktop/src/components/Toolbar.tsx
- apps/desktop/src/styles/workspace.css
- apps/desktop/src/components/__tests__/Inspector.test.tsx (NEW)

## Forbidden files
- packages/state/src/selectionStore.ts
- packages/state/src/commandStore.ts
- packages/state/src/index.ts
- apps/desktop/src/components/Canvas.tsx

## Verification
Run: pnpm vitest run apps/desktop/src/components/__tests__/Inspector.test.tsx
Run: pnpm -r build

OUTPUT DIR: F:/AI/studioflow/.multi-claude/workers/sf5-104

WHEN COMPLETE, write these two JSON files:

1. F:/AI/studioflow/.multi-claude/workers/sf5-104/artifacts.json:
{"files_created": [], "files_modified": [], "files_deleted": [], "test_files": []}

2. F:/AI/studioflow/.multi-claude/workers/sf5-104/writeback.json (MUST have top-level "writeback" key):
{"writeback": {"module": "...", "change_type": "feature", "summary": "...(10+ chars)", "files_touched": [], "contract_delta": "none", "risks": "...", "dependencies_affected": [], "tests_added": [], "docs_required": false, "architecture_impact": null, "relationship_suggestions": [], "prose": {"what_changed": "...", "why_changed": "...", "what_to_watch": "...", "what_affects_next": "..."}}}

IF F:/AI/studioflow/.multi-claude/workers/sf5-104/ERROR: Write to F:/AI/studioflow/.multi-claude/workers/sf5-104/ERROR file. Do NOT write artifacts/writeback.

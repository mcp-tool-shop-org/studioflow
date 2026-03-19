You are a multi-claude builder worker. Follow the packet instructions exactly.

RULES:
- Make ALL code changes inside your working directory: F:/AI/studioflow/.multi-claude/worktrees/sf5-102
- Do NOT run any multi-claude commands
- Do NOT access files outside your working directory
- Stay within the allowed files listed in the packet
- Do NOT modify forbidden files

YOUR PACKET:
# SF5-102 — Multi-Selection Law

**Role:** builder
**Goal:** Upgrade selectionStore from single-target to set-based semantics with additive, toggle, and marquee-ready selection.

## What to build

1. Create `packages/domain/src/selection.ts`:
   - SelectionMode: 'replace' | 'add' | 'toggle'
   - SelectionRect: { x: number, y: number, width: number, height: number }
   - SelectionBounds: { minX, minY, maxX, maxY } (computed from selected items)

2. Modify `packages/state/src/selectionStore.ts`:
   - Keep existing API backward-compatible
   - Add: selectWithMode(itemId: string, mode: SelectionMode) — replace/add/toggle semantics
   - Add: selectByRect(rect: SelectionRect, items: Array<{id, x, y, width, height}>) — marquee select
   - Add: getSelectionBounds() — compute bounds from selected items using documentStore
   - Add: selectAll(layerId: string) — select all items on a layer
   - Add: invertSelection(layerId: string) — toggle all items on a layer
   - Ensure clearSelection still works
   - Ensure toggleItemSelection still works

3. Modify `packages/state/src/__tests__/selectionStore.test.ts`:
   - Keep existing 9 tests
   - Add at least 12 new tests:
     - selectWithMode replace clears and sets
     - selectWithMode add appends
     - selectWithMode toggle toggles
     - selectByRect selects items within bounds
     - selectByRect with empty area selects nothing
     - selectAll selects all items on layer
     - invertSelection toggles all items
     - getSelectionBounds returns correct bounds
     - getSelectionBounds with no selection returns null
     - backward compat: selectItem still works
     - backward compat: toggleItemSelection still works
     - backward compat: clearSelection still works

## Important law
- Single-select behavior MUST remain correct (backward compat)
- Multi-select compound operations (duplicate/delete/nudge) must create ONE history entry
- Selection semantics must be deterministic, not order-dependent

## Allowed files
- packages/state/src/selectionStore.ts (MODIFY)
- packages/state/src/__tests__/selectionStore.test.ts (MODIFY)
- packages/domain/src/selection.ts (NEW)

## Forbidden files
- packages/state/src/index.ts
- packages/domain/src/index.ts
- packages/state/src/commandStore.ts
- apps/desktop/src/components/Canvas.tsx
- apps/desktop/src/components/Inspector.tsx

## Verification
Run: pnpm vitest run packages/state/src/__tests__/selectionStore.test.ts

OUTPUT DIRECTORY: F:/AI/studioflow/.multi-claude/workers/sf5-102

WHEN COMPLETE, write these two JSON files:

1. F:/AI/studioflow/.multi-claude/workers/sf5-102/artifacts.json — what files you changed:
{
  "files_created": ["path/to/new-file.ts"],
  "files_modified": ["path/to/existing-file.ts"],
  "files_deleted": [],
  "test_files": ["path/to/test-file.test.ts"]
}

2. F:/AI/studioflow/.multi-claude/workers/sf5-102/writeback.json — structured knowledge writeback (MUST have this exact nested structure):
{
  "writeback": {
    "module": "packages/state/src",
    "change_type": "feature",
    "summary": "Describe what you did (10+ chars)",
    "files_touched": ["list/of/files.ts"],
    "contract_delta": "none",
    "risks": "Describe any risks",
    "dependencies_affected": [],
    "tests_added": ["test-files.test.ts"],
    "docs_required": false,
    "architecture_impact": null,
    "relationship_suggestions": [],
    "prose": {
      "what_changed": "Describe what changed",
      "why_changed": "Describe why it changed",
      "what_to_watch": "Describe what to watch",
      "what_affects_next": "Describe what affects next"
    }
  }
}

IMPORTANT: F:/AI/studioflow/.multi-claude/workers/sf5-102/writeback.json MUST have a top-level "writeback" key.
All string fields must be non-empty. "summary" must be at least 10 characters.

IF YOU ENCOUNTER AN F:/AI/studioflow/.multi-claude/workers/sf5-102/ERROR:
- Write the error description to F:/AI/studioflow/.multi-claude/workers/sf5-102/ERROR file in the output directory
- Do NOT write F:/AI/studioflow/.multi-claude/workers/sf5-102/artifacts.json or F:/AI/studioflow/.multi-claude/workers/sf5-102/writeback.json

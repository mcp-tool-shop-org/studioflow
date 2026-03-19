You are a multi-claude builder worker.

RULES:
- Work in: F:/AI/studioflow/.multi-claude/worktrees/sf5-103
- Do NOT modify forbidden files
- Stay within allowed files

YOUR PACKET:
# SF5-103 — Canvas Interaction UX

**Role:** builder
**Depends on:** SF5-101 (viewport), SF5-102 (multi-selection)
**Goal:** Wire viewport + multi-selection into canvas with real interactions.

## What to build

1. Modify `apps/desktop/src/components/Canvas.tsx`:
   - Import useViewportStore for zoom/pan state
   - Wheel zoom: onWheel handler calls viewportStore.zoomIn/zoomOut based on deltaY
   - Drag pan: middle-click or Alt+left-click drag calls viewportStore.panBy
   - Apply viewport transform to canvas container (CSS transform: scale + translate)
   - Marquee selection: left-click drag on empty space draws a selection rectangle overlay
   - On marquee release, call selectionStore.selectByRect with items in bounds
   - Selected items: 2px cyan border (already exists, verify it works with multi-select)
   - Fit/Reset buttons in canvas header calling viewportStore.fitToCanvas/zoomReset
   - Zoom level display in canvas header (e.g. "100%")

2. Modify `apps/desktop/src/styles/workspace.css`:
   - Marquee selection rect overlay style (dashed border, semi-transparent fill)
   - Zoom level indicator style
   - Canvas transform container

3. Create `apps/desktop/src/components/__tests__/Canvas.test.tsx`:
   - At least 8 tests: canvas renders, zoom buttons work, items render with viewport transform, marquee overlay appears on drag, selected items have border, fit/reset controls exist
   - Mock @tauri-apps/api/core invoke

## Allowed files
- apps/desktop/src/components/Canvas.tsx
- apps/desktop/src/styles/workspace.css
- apps/desktop/src/components/__tests__/Canvas.test.tsx (NEW)

## Forbidden files
- packages/state/src/selectionStore.ts
- packages/state/src/viewportStore.ts
- packages/state/src/commandStore.ts
- packages/state/src/index.ts
- apps/desktop/src/components/Inspector.tsx

## Verification
Run: pnpm vitest run apps/desktop/src/components/__tests__/Canvas.test.tsx
Run: pnpm -r build

OUTPUT DIR: F:/AI/studioflow/.multi-claude/workers/sf5-103

WHEN COMPLETE, write these two JSON files:

1. F:/AI/studioflow/.multi-claude/workers/sf5-103/artifacts.json:
{"files_created": [], "files_modified": [], "files_deleted": [], "test_files": []}

2. F:/AI/studioflow/.multi-claude/workers/sf5-103/writeback.json (MUST have top-level "writeback" key):
{"writeback": {"module": "...", "change_type": "feature", "summary": "...(10+ chars)", "files_touched": [], "contract_delta": "none", "risks": "...", "dependencies_affected": [], "tests_added": [], "docs_required": false, "architecture_impact": null, "relationship_suggestions": [], "prose": {"what_changed": "...", "why_changed": "...", "what_to_watch": "...", "what_affects_next": "..."}}}

IF F:/AI/studioflow/.multi-claude/workers/sf5-103/ERROR: Write to F:/AI/studioflow/.multi-claude/workers/sf5-103/ERROR file. Do NOT write artifacts/writeback.

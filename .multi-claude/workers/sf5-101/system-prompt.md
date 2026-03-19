You are a multi-claude builder worker. Follow the packet instructions exactly.

RULES:
- Make ALL code changes inside your working directory: F:/AI/studioflow/.multi-claude/worktrees/sf5-101
- Do NOT run any multi-claude commands
- Do NOT access files outside your working directory
- Stay within the allowed files listed in the packet
- Do NOT modify forbidden files

YOUR PACKET:
# SF5-101 — Viewport Law

**Role:** builder
**Goal:** Add viewport state (zoom, pan offset) and commands to StudioFlow.

## What to build

1. Create `packages/domain/src/viewport.ts`:
   - ViewportState: zoom (number, default 1.0, range 0.1-5.0), panX (number, default 0), panY (number, default 0)
   - ViewportAction: 'viewport:zoom-in' | 'viewport:zoom-out' | 'viewport:zoom-reset' | 'viewport:fit' | 'viewport:pan'
   - ZOOM_STEP = 0.1, MIN_ZOOM = 0.1, MAX_ZOOM = 5.0

2. Create `packages/state/src/viewportStore.ts`:
   - Zustand store with: zoom, panX, panY
   - Actions: zoomIn(), zoomOut(), zoomTo(level), zoomReset(), panTo(x, y), panBy(dx, dy), fitToCanvas(canvasWidth, canvasHeight, contentBounds)
   - zoomIn/zoomOut clamp to MIN/MAX
   - reset()

3. Create `packages/state/src/__tests__/viewportStore.test.ts`:
   - At least 12 tests: initial state, zoomIn, zoomOut, clamp at min/max, zoomReset, panTo, panBy, fitToCanvas, reset
   - Test zoom step arithmetic

## Important law
- Viewport is workspace state, NOT document content
- Viewport changes do NOT create history entries
- Viewport is session-only, not persisted in project files

## Allowed files
- packages/domain/src/viewport.ts (NEW)
- packages/state/src/viewportStore.ts (NEW)
- packages/state/src/__tests__/viewportStore.test.ts (NEW)

## Forbidden files
- packages/state/src/index.ts
- packages/domain/src/index.ts
- apps/desktop/src/components/Canvas.tsx
- apps/desktop/src/components/Workspace.tsx

## Verification
Run: pnpm vitest run packages/state/src/__tests__/viewportStore.test.ts

OUTPUT DIRECTORY: F:/AI/studioflow/.multi-claude/workers/sf5-101

WHEN COMPLETE, write these two JSON files:

1. F:/AI/studioflow/.multi-claude/workers/sf5-101/artifacts.json — what files you changed:
{
  "files_created": ["path/to/new-file.ts"],
  "files_modified": ["path/to/existing-file.ts"],
  "files_deleted": [],
  "test_files": ["path/to/test-file.test.ts"]
}

2. F:/AI/studioflow/.multi-claude/workers/sf5-101/writeback.json — structured knowledge writeback (MUST have this exact nested structure):
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

IMPORTANT: F:/AI/studioflow/.multi-claude/workers/sf5-101/writeback.json MUST have a top-level "writeback" key.
All string fields must be non-empty. "summary" must be at least 10 characters.

IF YOU ENCOUNTER AN F:/AI/studioflow/.multi-claude/workers/sf5-101/ERROR:
- Write the error description to F:/AI/studioflow/.multi-claude/workers/sf5-101/ERROR file in the output directory
- Do NOT write F:/AI/studioflow/.multi-claude/workers/sf5-101/artifacts.json or F:/AI/studioflow/.multi-claude/workers/sf5-101/writeback.json

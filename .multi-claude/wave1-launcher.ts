import { query } from '@anthropic-ai/claude-agent-sdk';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

interface WorkerJob {
  id: string;
  worktreePath: string;
  outputDir: string;
  model: string;
  tools: string[];
  systemPrompt: string;
}

const SCHEMA_INSTRUCTIONS = `
WHEN COMPLETE, write these two JSON files:

1. artifacts.json — what files you changed:
{
  "files_created": ["path/to/new-file.ts"],
  "files_modified": ["path/to/existing-file.ts"],
  "files_deleted": [],
  "test_files": ["path/to/test-file.test.ts"]
}

2. writeback.json — structured knowledge writeback (MUST have this exact nested structure):
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

IMPORTANT: writeback.json MUST have a top-level "writeback" key.
All string fields must be non-empty. "summary" must be at least 10 characters.

IF YOU ENCOUNTER AN ERROR:
- Write the error description to ERROR file in the output directory
- Do NOT write artifacts.json or writeback.json
`;

function makeJob(id: string, packetPrompt: string): WorkerJob {
  const base = 'F:/AI/studioflow';
  const outDir = `${base}/.multi-claude/workers/${id}`;
  const wtPath = `${base}/.multi-claude/worktrees/${id}`;

  const systemPrompt = `You are a multi-claude builder worker. Follow the packet instructions exactly.

RULES:
- Make ALL code changes inside your working directory: ${wtPath.replace(/\\/g, '/')}
- Do NOT run any multi-claude commands
- Do NOT access files outside your working directory
- Stay within the allowed files listed in the packet
- Do NOT modify forbidden files

YOUR PACKET:
${packetPrompt}

OUTPUT DIRECTORY: ${outDir.replace(/\\/g, '/')}
${SCHEMA_INSTRUCTIONS.replace(/artifacts\.json/g, `${outDir.replace(/\\/g, '/')}/artifacts.json`).replace(/writeback\.json/g, `${outDir.replace(/\\/g, '/')}/writeback.json`).replace(/ERROR/g, `${outDir.replace(/\\/g, '/')}/ERROR`)}`;

  return {
    id,
    worktreePath: wtPath,
    outputDir: outDir,
    model: 'claude-sonnet-4-6',
    tools: ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep'],
    systemPrompt,
  };
}

async function runWorker(job: WorkerJob): Promise<{ id: string; status: string; error?: string; durationMs: number }> {
  const start = Date.now();
  console.log(`[${job.id}] Starting (model: ${job.model})`);

  // Write envelope
  const promptHash = createHash('sha256').update(job.systemPrompt).digest('hex').slice(0, 16);
  writeFileSync(`${job.outputDir}/prompt-hash.txt`, promptHash);
  writeFileSync(`${job.outputDir}/system-prompt.md`, job.systemPrompt);
  writeFileSync(`${job.outputDir}/envelope.json`, JSON.stringify({
    sessionId: `sess-${job.id}-${Date.now()}`,
    packetId: job.id,
    role: 'builder',
    model: job.model,
    toolProfile: job.tools,
    cwd: job.worktreePath,
    outputDir: job.outputDir,
    promptHash,
    startedAt: new Date().toISOString(),
    status: 'running',
  }, null, 2));

  try {
    let lastResult = '';
    for await (const message of query({
      prompt: `Execute the build packet. Work in ${job.worktreePath.replace(/\\/g, '/')} and follow all rules.`,
      options: {
        cwd: job.worktreePath,
        allowedTools: job.tools,
        model: job.model,
        systemPrompt: job.systemPrompt,
        permissionMode: 'bypassPermissions',
        maxTurns: 50,
      },
    })) {
      if ('result' in message && typeof message.result === 'string') {
        lastResult = message.result;
      }
    }

    writeFileSync(`${job.outputDir}/output.log`, lastResult);

    const hasArtifacts = existsSync(`${job.outputDir}/artifacts.json`);
    const hasWriteback = existsSync(`${job.outputDir}/writeback.json`);
    const hasError = existsSync(`${job.outputDir}/ERROR`);

    const status = hasError ? 'failed' : (hasArtifacts && hasWriteback) ? 'completed' : 'malformed_output';
    const elapsed = Date.now() - start;

    // Update envelope
    writeFileSync(`${job.outputDir}/envelope.json`, JSON.stringify({
      sessionId: `sess-${job.id}-${Date.now()}`,
      packetId: job.id,
      role: 'builder',
      model: job.model,
      toolProfile: job.tools,
      cwd: job.worktreePath,
      outputDir: job.outputDir,
      promptHash,
      startedAt: new Date(start).toISOString(),
      completedAt: new Date().toISOString(),
      status,
      stopReason: status,
    }, null, 2));

    console.log(`[${job.id}] ${status} in ${(elapsed / 1000).toFixed(1)}s`);
    return { id: job.id, status, durationMs: elapsed };
  } catch (err) {
    const elapsed = Date.now() - start;
    const errorMsg = err instanceof Error ? err.message : String(err);
    writeFileSync(`${job.outputDir}/ERROR`, errorMsg);
    console.error(`[${job.id}] ERROR in ${(elapsed / 1000).toFixed(1)}s: ${errorMsg}`);
    return { id: job.id, status: 'failed', error: errorMsg, durationMs: elapsed };
  }
}

// ── Packet prompts ──────────────────────────────────────────────

const SF5_101_PROMPT = `# SF5-101 — Viewport Law

**Role:** builder
**Goal:** Add viewport state (zoom, pan offset) and commands to StudioFlow.

## What to build

1. Create \`packages/domain/src/viewport.ts\`:
   - ViewportState: zoom (number, default 1.0, range 0.1-5.0), panX (number, default 0), panY (number, default 0)
   - ViewportAction: 'viewport:zoom-in' | 'viewport:zoom-out' | 'viewport:zoom-reset' | 'viewport:fit' | 'viewport:pan'
   - ZOOM_STEP = 0.1, MIN_ZOOM = 0.1, MAX_ZOOM = 5.0

2. Create \`packages/state/src/viewportStore.ts\`:
   - Zustand store with: zoom, panX, panY
   - Actions: zoomIn(), zoomOut(), zoomTo(level), zoomReset(), panTo(x, y), panBy(dx, dy), fitToCanvas(canvasWidth, canvasHeight, contentBounds)
   - zoomIn/zoomOut clamp to MIN/MAX
   - reset()

3. Create \`packages/state/src/__tests__/viewportStore.test.ts\`:
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
Run: pnpm vitest run packages/state/src/__tests__/viewportStore.test.ts`;

const SF5_102_PROMPT = `# SF5-102 — Multi-Selection Law

**Role:** builder
**Goal:** Upgrade selectionStore from single-target to set-based semantics with additive, toggle, and marquee-ready selection.

## What to build

1. Create \`packages/domain/src/selection.ts\`:
   - SelectionMode: 'replace' | 'add' | 'toggle'
   - SelectionRect: { x: number, y: number, width: number, height: number }
   - SelectionBounds: { minX, minY, maxX, maxY } (computed from selected items)

2. Modify \`packages/state/src/selectionStore.ts\`:
   - Keep existing API backward-compatible
   - Add: selectWithMode(itemId: string, mode: SelectionMode) — replace/add/toggle semantics
   - Add: selectByRect(rect: SelectionRect, items: Array<{id, x, y, width, height}>) — marquee select
   - Add: getSelectionBounds() — compute bounds from selected items using documentStore
   - Add: selectAll(layerId: string) — select all items on a layer
   - Add: invertSelection(layerId: string) — toggle all items on a layer
   - Ensure clearSelection still works
   - Ensure toggleItemSelection still works

3. Modify \`packages/state/src/__tests__/selectionStore.test.ts\`:
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
Run: pnpm vitest run packages/state/src/__tests__/selectionStore.test.ts`;

// ── Launch ──────────────────────────────────────────────────────

async function main() {
  const jobs = [
    makeJob('sf5-101', SF5_101_PROMPT),
    makeJob('sf5-102', SF5_102_PROMPT),
  ];

  console.log(`Launching ${jobs.length} independent SDK workers in parallel...`);
  const results = await Promise.allSettled(jobs.map(j => runWorker(j)));

  for (const r of results) {
    if (r.status === 'fulfilled') {
      console.log(`  ${r.value.id}: ${r.value.status} (${(r.value.durationMs / 1000).toFixed(1)}s)`);
    } else {
      console.error(`  REJECTED: ${r.reason}`);
    }
  }
  console.log('Wave 1 complete.');
}

main().catch(console.error);

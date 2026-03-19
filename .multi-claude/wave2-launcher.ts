import { query } from '@anthropic-ai/claude-agent-sdk';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const SCHEMA_INSTRUCTIONS = `
WHEN COMPLETE, write these two JSON files:

1. artifacts.json:
{"files_created": [], "files_modified": [], "files_deleted": [], "test_files": []}

2. writeback.json (MUST have top-level "writeback" key):
{"writeback": {"module": "...", "change_type": "feature", "summary": "...(10+ chars)", "files_touched": [], "contract_delta": "none", "risks": "...", "dependencies_affected": [], "tests_added": [], "docs_required": false, "architecture_impact": null, "relationship_suggestions": [], "prose": {"what_changed": "...", "why_changed": "...", "what_to_watch": "...", "what_affects_next": "..."}}}

IF ERROR: Write to ERROR file. Do NOT write artifacts/writeback.
`;

interface Job { id: string; worktreePath: string; outputDir: string; model: string; tools: string[]; prompt: string; }

function makeSystemPrompt(job: Job): string {
  const out = job.outputDir.replace(/\\/g, '/');
  const wt = job.worktreePath.replace(/\\/g, '/');
  return `You are a multi-claude builder worker.

RULES:
- Work in: ${wt}
- Do NOT modify forbidden files
- Stay within allowed files

YOUR PACKET:
${job.prompt}

OUTPUT DIR: ${out}
${SCHEMA_INSTRUCTIONS.replace(/artifacts\.json/g, `${out}/artifacts.json`).replace(/writeback\.json/g, `${out}/writeback.json`).replace(/ERROR/g, `${out}/ERROR`)}`;
}

async function runWorker(job: Job): Promise<{ id: string; status: string; error?: string; ms: number }> {
  const start = Date.now();
  const sys = makeSystemPrompt(job);
  const hash = createHash('sha256').update(sys).digest('hex').slice(0, 16);
  writeFileSync(`${job.outputDir}/prompt-hash.txt`, hash);
  writeFileSync(`${job.outputDir}/system-prompt.md`, sys);
  writeFileSync(`${job.outputDir}/envelope.json`, JSON.stringify({ sessionId: `sess-${job.id}-${Date.now()}`, packetId: job.id, role: 'builder', model: job.model, toolProfile: job.tools, cwd: job.worktreePath, outputDir: job.outputDir, promptHash: hash, startedAt: new Date().toISOString(), status: 'running' }, null, 2));

  console.log(`[${job.id}] Starting (${job.model})`);
  try {
    let lastResult = '';
    for await (const msg of query({ prompt: `Execute the build packet. Work in ${job.worktreePath.replace(/\\/g, '/')} and follow all rules.`, options: { cwd: job.worktreePath, allowedTools: job.tools, model: job.model, systemPrompt: sys, permissionMode: 'bypassPermissions', maxTurns: 50 } })) {
      if ('result' in msg && typeof msg.result === 'string') lastResult = msg.result;
    }
    writeFileSync(`${job.outputDir}/output.log`, lastResult);
    const status = existsSync(`${job.outputDir}/ERROR`) ? 'failed' : (existsSync(`${job.outputDir}/artifacts.json`) && existsSync(`${job.outputDir}/writeback.json`)) ? 'completed' : 'malformed_output';
    const ms = Date.now() - start;
    writeFileSync(`${job.outputDir}/envelope.json`, JSON.stringify({ sessionId: `sess-${job.id}-${Date.now()}`, packetId: job.id, role: 'builder', model: job.model, toolProfile: job.tools, cwd: job.worktreePath, outputDir: job.outputDir, promptHash: hash, startedAt: new Date(start).toISOString(), completedAt: new Date().toISOString(), status, stopReason: status }, null, 2));
    console.log(`[${job.id}] ${status} in ${(ms/1000).toFixed(1)}s`);
    return { id: job.id, status, ms };
  } catch (err) {
    const ms = Date.now() - start;
    const e = err instanceof Error ? err.message : String(err);
    writeFileSync(`${job.outputDir}/ERROR`, e);
    writeFileSync(`${job.outputDir}/envelope.json`, JSON.stringify({ sessionId: `sess-${job.id}-${Date.now()}`, packetId: job.id, role: 'builder', model: job.model, toolProfile: job.tools, cwd: job.worktreePath, outputDir: job.outputDir, promptHash: hash, startedAt: new Date(start).toISOString(), completedAt: new Date().toISOString(), status: 'failed', stopReason: 'failed', error: e }, null, 2));
    console.error(`[${job.id}] FAILED in ${(ms/1000).toFixed(1)}s: ${e}`);
    return { id: job.id, status: 'failed', error: e, ms };
  }
}

const base = 'F:/AI/studioflow';
const tools = ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep'];

const SF5_103: Job = { id: 'sf5-103', worktreePath: `${base}/.multi-claude/worktrees/sf5-103`, outputDir: `${base}/.multi-claude/workers/sf5-103`, model: 'claude-sonnet-4-6', tools, prompt: `# SF5-103 — Canvas Interaction UX

**Role:** builder
**Depends on:** SF5-101 (viewport), SF5-102 (multi-selection)
**Goal:** Wire viewport + multi-selection into canvas with real interactions.

## What to build

1. Modify \`apps/desktop/src/components/Canvas.tsx\`:
   - Import useViewportStore for zoom/pan state
   - Wheel zoom: onWheel handler calls viewportStore.zoomIn/zoomOut based on deltaY
   - Drag pan: middle-click or Alt+left-click drag calls viewportStore.panBy
   - Apply viewport transform to canvas container (CSS transform: scale + translate)
   - Marquee selection: left-click drag on empty space draws a selection rectangle overlay
   - On marquee release, call selectionStore.selectByRect with items in bounds
   - Selected items: 2px cyan border (already exists, verify it works with multi-select)
   - Fit/Reset buttons in canvas header calling viewportStore.fitToCanvas/zoomReset
   - Zoom level display in canvas header (e.g. "100%")

2. Modify \`apps/desktop/src/styles/workspace.css\`:
   - Marquee selection rect overlay style (dashed border, semi-transparent fill)
   - Zoom level indicator style
   - Canvas transform container

3. Create \`apps/desktop/src/components/__tests__/Canvas.test.tsx\`:
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
Run: pnpm -r build` };

const SF5_104: Job = { id: 'sf5-104', worktreePath: `${base}/.multi-claude/worktrees/sf5-104`, outputDir: `${base}/.multi-claude/workers/sf5-104`, model: 'claude-sonnet-4-6', tools, prompt: `# SF5-104 — Command Surface + Inspector

**Role:** builder
**Depends on:** SF5-102 (multi-selection)
**Goal:** Add keyboard shortcuts, batch actions, and multi-select inspector.

## What to build

1. Modify \`apps/desktop/src/components/Inspector.tsx\`:
   - When multiple items selected: show count, shared properties, mixed-state indicators
   - Mixed values shown as "—" or "mixed" placeholder
   - Batch property edit: changing a value applies to ALL selected items via dispatch loop
   - "Duplicate Selected" button: dispatches item:add for each selected item with offset position
   - "Delete Selected" button: dispatches item:delete for each selected item
   - "Nudge" controls: arrow buttons that dispatch item:move with +/-10px offset for all selected

2. Modify \`apps/desktop/src/components/Toolbar.tsx\`:
   - Add keyboard shortcut handler (useEffect with keydown):
     - Delete/Backspace: delete selected items
     - Ctrl+D: duplicate selected items
     - Ctrl+A: select all items on active layer
     - Arrow keys: nudge selected items by 1px (10px with Shift)
     - Escape: clear selection
   - Add visible shortcut hint buttons where useful

3. Modify \`apps/desktop/src/styles/workspace.css\`:
   - Multi-select inspector styles: mixed value indicator, batch action buttons
   - Shortcut hint badge styles

4. Create \`apps/desktop/src/components/__tests__/Inspector.test.tsx\`:
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
Run: pnpm -r build` };

async function main() {
  console.log('Launching Wave 2: SF5-103 + SF5-104 in parallel...');
  const results = await Promise.allSettled([runWorker(SF5_103), runWorker(SF5_104)]);
  for (const r of results) {
    if (r.status === 'fulfilled') console.log(`  ${r.value.id}: ${r.value.status} (${(r.value.ms/1000).toFixed(1)}s)`);
    else console.error(`  REJECTED: ${r.reason}`);
  }
  console.log('Wave 2 complete.');
}

main().catch(console.error);

import { query } from '@anthropic-ai/claude-agent-sdk';
import { writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const base = 'F:/AI/studioflow';
const outDir = `${base}/.multi-claude/workers/sf5-301`;
const wtPath = `${base}/.multi-claude/worktrees/sf5-301`;

const PROMPT = `# SF5-301 — Integrator

**Role:** integrator
**Tool profile:** Read, Write, Edit, Bash, Glob, Grep

You are the independent integrator for StudioFlow Phase 5. Your job is to ensure all builder outputs are properly wired, seam files are correct, and the app builds and tests cleanly.

Work in: ${wtPath.replace(/\\/g, '/')}

## Integration checklist

### 1. Verify seam files are correct

Check packages/domain/src/index.ts:
- Must export viewport.ts types
- Must export selection.ts types
- Must export all existing types

Check packages/state/src/index.ts:
- Must export useViewportStore
- Must export ViewportStoreState type
- Must export all existing stores

Check packages/state/src/commandStore.ts:
- Must handle all CommandType values in the switch (including any new viewport/selection commands if added)
- Exhaustive switch must compile

### 2. Verify vitest.config.ts aliases
- @studioflow/domain must resolve to packages/domain/src/index.ts
- @studioflow/state must resolve to packages/state/src/index.ts
- @tauri-apps/plugin-dialog mock must be in place

### 3. Run full validation
Run these commands and report results:
- pnpm install (if needed)
- pnpm -r build
- pnpm vitest run
- Report exact test count and any failures

### 4. Fix any integration issues
If barrel exports are missing, add them.
If command routing has gaps, fix them.
If CSS has conflicts, resolve them.
If imports are broken, fix them.

### 5. Record seam handling
Write ${outDir.replace(/\\/g, '/')}/integration-report.json:
{
  "integrator": "sf5-301",
  "timestamp": "ISO",
  "seam_files_checked": ["list of files"],
  "seam_fixes_applied": ["list of fixes or empty"],
  "build_result": "pass/fail",
  "test_count": N,
  "test_failures": N,
  "verdict": "pass/fail",
  "notes": "honest summary"
}

Also write artifacts.json and writeback.json per standard schema to ${outDir.replace(/\\/g, '/')}/
`;

const systemPrompt = `You are a multi-claude integrator worker. You verify and fix integration seams.

RULES:
- Work in: ${wtPath.replace(/\\/g, '/')}
- You may modify seam/barrel files to fix integration
- You may NOT rewrite builder code
- You may fix imports, exports, and wiring
- Be honest about what you find and fix
- Output to: ${outDir.replace(/\\/g, '/')}

${PROMPT}`;

async function main() {
  const start = Date.now();
  const hash = createHash('sha256').update(systemPrompt).digest('hex').slice(0, 16);

  writeFileSync(`${outDir}/prompt-hash.txt`, hash);
  writeFileSync(`${outDir}/system-prompt.md`, systemPrompt);
  writeFileSync(`${outDir}/envelope.json`, JSON.stringify({
    sessionId: `sess-sf5-301-${Date.now()}`,
    packetId: 'sf5-301',
    role: 'integrator',
    model: 'claude-sonnet-4-6',
    toolProfile: ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep'],
    cwd: wtPath,
    outputDir: outDir,
    promptHash: hash,
    startedAt: new Date().toISOString(),
    status: 'running',
  }, null, 2));

  console.log('[sf5-301] Starting independent integrator session (Sonnet)');

  try {
    let lastResult = '';
    for await (const msg of query({
      prompt: 'Execute the integration checklist. Check seams, fix issues, validate build+tests, write report.',
      options: {
        cwd: wtPath,
        allowedTools: ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep'],
        model: 'claude-sonnet-4-6',
        systemPrompt,
        permissionMode: 'bypassPermissions',
        maxTurns: 40,
      },
    })) {
      if ('result' in msg && typeof msg.result === 'string') lastResult = msg.result;
    }

    writeFileSync(`${outDir}/output.log`, lastResult);
    const ms = Date.now() - start;
    writeFileSync(`${outDir}/envelope.json`, JSON.stringify({
      sessionId: `sess-sf5-301-${Date.now()}`,
      packetId: 'sf5-301',
      role: 'integrator',
      model: 'claude-sonnet-4-6',
      toolProfile: ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep'],
      cwd: wtPath,
      outputDir: outDir,
      promptHash: hash,
      startedAt: new Date(start).toISOString(),
      completedAt: new Date().toISOString(),
      status: 'completed',
      stopReason: 'completed',
    }, null, 2));
    console.log(`[sf5-301] Completed in ${(ms/1000).toFixed(1)}s`);
  } catch (err) {
    const ms = Date.now() - start;
    const e = err instanceof Error ? err.message : String(err);
    writeFileSync(`${outDir}/ERROR`, e);
    console.error(`[sf5-301] FAILED in ${(ms/1000).toFixed(1)}s: ${e}`);
  }
}

main().catch(console.error);

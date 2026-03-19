import { query } from '@anthropic-ai/claude-agent-sdk';
import { writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const base = 'F:/AI/studioflow';
const outDir = `${base}/.multi-claude/workers/sf5-201`;
const wtPath = `${base}/.multi-claude/worktrees/sf5-201`;

const CHECKLIST = `# SF5-201 — Verifier Checklist

**Role:** verifier-checklist
**Tool profile:** Read, Bash, Glob, Grep (NO Write, NO Edit)

You are an independent verifier. Your job is to CHECK the work, not fix it.
Do NOT modify any files. Only read, run commands, and report.

## Verification Checklist

Check each item. Write your findings to ${outDir.replace(/\\/g, '/')}/verification-report.json

For each check, record: { "check": "name", "pass": true/false, "evidence": "what you found" }

### Build checks
1. Run \`pnpm -r build\` — does it pass with zero errors?
2. Run \`pnpm vitest run\` — how many tests pass? Any failures?

### Runtime envelope checks
3. Does ${base.replace(/\\/g, '/')}/.multi-claude/workers/sf5-101/envelope.json exist and contain model, toolProfile, startedAt, completedAt, status?
4. Does sf5-102/envelope.json exist with same fields?
5. Does sf5-103/envelope.json exist with same fields?
6. Does sf5-104/envelope.json exist with same fields?
7. Do all 4 envelopes show model: "claude-sonnet-4-6"?
8. Do all 4 envelopes show status: "completed"?

### Tool profile check
9. Read each envelope's toolProfile — do they all show builder tools (Read, Write, Edit, Bash, Glob, Grep)?

### Scope checks
10. Read sf5-101/artifacts.json — are all files within allowed scope (packages/domain/src/viewport.ts, packages/state/src/viewportStore.ts, packages/state/src/__tests__/viewportStore.test.ts)?
11. Read sf5-102/artifacts.json — files within scope?
12. Read sf5-103/artifacts.json — files within scope (apps/desktop/src/components/Canvas.tsx, workspace.css, Canvas.test.tsx)?
13. Read sf5-104/artifacts.json — files within scope?

### Functional checks
14. Read packages/state/src/viewportStore.ts — does it have zoom, pan, fit actions?
15. Read packages/state/src/selectionStore.ts — does it have selectWithMode, selectByRect, selectAll?
16. Read apps/desktop/src/components/Canvas.tsx — does it handle wheel zoom, pan, marquee selection?
17. Read apps/desktop/src/components/Inspector.tsx — does it handle multi-select display and batch actions?
18. Read apps/desktop/src/components/Toolbar.tsx — does it have keyboard shortcut handlers?

### History integration
19. Run: pnpm vitest run packages/state/src/__tests__/historyStore.test.ts — do all history tests still pass?

### Stop drill evidence
20. Was the stop drill executed? Check for any envelope with stopReason: "stopped". Report honestly if not found.

## Output

Write your complete report to: ${outDir.replace(/\\/g, '/')}/verification-report.json

Format:
{
  "verifier": "sf5-201",
  "timestamp": "ISO string",
  "overall_verdict": "pass" or "fail",
  "checks_passed": N,
  "checks_failed": N,
  "checks": [ { "id": 1, "check": "...", "pass": true/false, "evidence": "..." }, ... ],
  "stop_drill_proven": true/false,
  "summary": "one paragraph honest summary"
}

Also write the text "pass" or "fail" to: ${outDir.replace(/\\/g, '/')}/VERDICT
`;

const systemPrompt = `You are a multi-claude verifier-checklist worker. You VERIFY work — you do NOT fix or modify anything.

RULES:
- You have READ-ONLY access plus Bash for running test/build commands
- Do NOT create or modify any source code files
- Do NOT use Write or Edit tools on source files
- You MAY write to the output directory: ${outDir.replace(/\\/g, '/')}
- Be honest. If something fails, report it as failed.
- Work in: ${wtPath.replace(/\\/g, '/')}

YOUR CHECKLIST:
${CHECKLIST}`;

async function main() {
  const start = Date.now();
  const hash = createHash('sha256').update(systemPrompt).digest('hex').slice(0, 16);

  writeFileSync(`${outDir}/prompt-hash.txt`, hash);
  writeFileSync(`${outDir}/system-prompt.md`, systemPrompt);
  writeFileSync(`${outDir}/envelope.json`, JSON.stringify({
    sessionId: `sess-sf5-201-${Date.now()}`,
    packetId: 'sf5-201',
    role: 'verifier-checklist',
    model: 'claude-sonnet-4-6',
    toolProfile: ['Read', 'Bash', 'Glob', 'Grep'],
    cwd: wtPath,
    outputDir: outDir,
    promptHash: hash,
    startedAt: new Date().toISOString(),
    status: 'running',
  }, null, 2));

  console.log('[sf5-201] Starting independent verifier session (Sonnet, read-only profile)');

  try {
    let lastResult = '';
    for await (const msg of query({
      prompt: 'Execute the verification checklist. Check every item honestly. Write your report.',
      options: {
        cwd: wtPath,
        allowedTools: ['Read', 'Bash', 'Glob', 'Grep'],
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
      sessionId: `sess-sf5-201-${Date.now()}`,
      packetId: 'sf5-201',
      role: 'verifier-checklist',
      model: 'claude-sonnet-4-6',
      toolProfile: ['Read', 'Bash', 'Glob', 'Grep'],
      cwd: wtPath,
      outputDir: outDir,
      promptHash: hash,
      startedAt: new Date(start).toISOString(),
      completedAt: new Date().toISOString(),
      status: 'completed',
      stopReason: 'completed',
    }, null, 2));

    console.log(`[sf5-201] Completed in ${(ms/1000).toFixed(1)}s`);
  } catch (err) {
    const ms = Date.now() - start;
    const e = err instanceof Error ? err.message : String(err);
    writeFileSync(`${outDir}/ERROR`, e);
    console.error(`[sf5-201] FAILED in ${(ms/1000).toFixed(1)}s: ${e}`);
  }
}

main().catch(console.error);

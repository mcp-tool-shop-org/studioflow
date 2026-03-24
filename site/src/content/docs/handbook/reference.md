---
title: Reference
description: Commands, testing, and multi-claude proof runs.
sidebar:
  order: 3
---

## Commands

```bash
pnpm dev          # Launch Tauri dev window
pnpm build        # Build all packages
pnpm test         # Run vitest across all packages
pnpm typecheck    # TypeScript check across monorepo
pnpm verify       # typecheck + test in one command
```

## Test structure

12 test files across three layers:

### Domain tests
- `packages/domain/src/__tests__/types.test.ts` — Domain type validation

### State tests
- `packages/state/src/__tests__/documentStore.test.ts`
- `packages/state/src/__tests__/selectionStore.test.ts`
- `packages/state/src/__tests__/viewportStore.test.ts`
- `packages/state/src/__tests__/commandStore.test.ts`
- `packages/state/src/__tests__/historyStore.test.ts`
- `packages/state/src/__tests__/persistenceStore.test.ts`
- `packages/state/src/__tests__/workspaceStore.test.ts`
- `packages/state/src/__tests__/editing.test.ts`

### Component tests
- `apps/desktop/src/components/__tests__/Canvas.test.tsx`
- `apps/desktop/src/components/__tests__/Inspector.test.tsx`
- `apps/desktop/src/components/__tests__/Workspace.test.tsx`

## Multi-claude proof runs

### Phase 5 — Viewport + Multi-Selection
4 builder packets in isolated worktrees, 2 parallel waves. Verifier checked 20 points (19 passed). Integrator merged all work.

### Phase 6 — Qualified Pass
Proved independent builder and verifier execution under the SDK runtime. Stop-path control was the only unproven element.

See `PHASE-5-CONTRACT.md` and `PHASE-6-POSTMORTEM.md` in the repo root.

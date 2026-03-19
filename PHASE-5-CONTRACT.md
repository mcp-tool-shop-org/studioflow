# StudioFlow Phase 5 — Viewport + Multi-Selection Fluency
# Contract Freeze (Multi-Claude Phase 6 Proof Run)

## Product goal
Add real editing fluency: zoom, pan, marquee multi-select, batch actions, keyboard shortcuts.

## Proof goal
Demonstrate the multi-claude system under real load with real role independence.

---

## Packet Plan

### SF5-101 — Viewport Law
**Role:** builder (Sonnet)
**Depends on:** none (Wave 1)

**Goal:** Add viewport state (zoom, pan offset) and commands.

**Allowed files:**
- `packages/state/src/viewportStore.ts` (NEW)
- `packages/state/src/__tests__/viewportStore.test.ts` (NEW)
- `packages/domain/src/viewport.ts` (NEW)

**Forbidden files:**
- `packages/state/src/index.ts` — integration-owned barrel
- `packages/domain/src/index.ts` — integration-owned barrel
- `apps/desktop/src/components/Canvas.tsx` — owned by SF5-103
- `apps/desktop/src/components/Workspace.tsx` — protected root layout

**Rationale:** Viewport is workspace state, not document content. Viewport changes do NOT create history entries. Viewport is session-only (not persisted in project files).

**Verification:** `pnpm vitest run packages/state/src/__tests__/viewportStore.test.ts` passes, `pnpm -r build` passes.

---

### SF5-102 — Multi-Selection Law
**Role:** builder (Sonnet)
**Depends on:** none (Wave 1)

**Goal:** Upgrade selectionStore from single-target to set-based semantics. Add additive select, toggle, marquee-ready rectangle selection, compound command support.

**Allowed files:**
- `packages/state/src/selectionStore.ts` (MODIFY)
- `packages/state/src/__tests__/selectionStore.test.ts` (MODIFY — add multi-select tests)
- `packages/domain/src/selection.ts` (NEW — SelectionRect, SelectionMode types)

**Forbidden files:**
- `packages/state/src/index.ts` — integration-owned
- `packages/domain/src/index.ts` — integration-owned
- `packages/state/src/commandStore.ts` — owned by integration for command routing updates
- `apps/desktop/src/components/Canvas.tsx` — owned by SF5-103
- `apps/desktop/src/components/Inspector.tsx` — owned by SF5-104

**Rationale:** Selection law must be frozen before canvas/inspector can consume it. Compound multi-item operations (duplicate/delete/nudge) must create ONE history entry, not N separate entries.

**Verification:** `pnpm vitest run packages/state/src/__tests__/selectionStore.test.ts` passes, `pnpm -r build` passes.

---

### SF5-103 — Canvas Interaction UX
**Role:** builder (Sonnet)
**Depends on:** SF5-101, SF5-102 (Wave 2)

**Goal:** Wire viewport + multi-selection into canvas: wheel zoom, drag pan, marquee drag rectangle, hit testing, selection overlay, fit/reset affordances.

**Allowed files:**
- `apps/desktop/src/components/Canvas.tsx` (MODIFY)
- `apps/desktop/src/styles/workspace.css` (MODIFY — canvas interaction styles)
- `apps/desktop/src/components/__tests__/Canvas.test.tsx` (NEW)

**Forbidden files:**
- `packages/state/src/selectionStore.ts` — frozen by SF5-102
- `packages/state/src/viewportStore.ts` — frozen by SF5-101
- `packages/state/src/commandStore.ts` — integration-owned
- `packages/state/src/index.ts` — integration-owned
- `apps/desktop/src/components/Inspector.tsx` — owned by SF5-104

**Rationale:** Canvas consumes the frozen viewport + selection contracts. It does NOT redefine them.

**Verification:** `pnpm vitest run apps/desktop/src/components/__tests__/Canvas.test.tsx` passes, `pnpm -r build` passes.

**STOP DRILL TARGET:** This packet will be stopped mid-execution and restarted to prove the stop/retry runtime path.

---

### SF5-104 — Command Surface + Inspector
**Role:** builder (Sonnet)
**Depends on:** SF5-102 (Wave 2, parallel with SF5-103)

**Goal:** Duplicate/delete/nudge shortcuts, select-all/clear, batch actions, multi-select inspector summary with mixed-state display.

**Allowed files:**
- `apps/desktop/src/components/Inspector.tsx` (MODIFY)
- `apps/desktop/src/components/Toolbar.tsx` (MODIFY — add shortcut buttons)
- `apps/desktop/src/styles/workspace.css` (MODIFY — inspector multi-select styles)
- `apps/desktop/src/components/__tests__/Inspector.test.tsx` (NEW)

**Forbidden files:**
- `packages/state/src/selectionStore.ts` — frozen by SF5-102
- `packages/state/src/commandStore.ts` — integration-owned
- `packages/state/src/index.ts` — integration-owned
- `apps/desktop/src/components/Canvas.tsx` — owned by SF5-103

**Rationale:** This packet calls into the command/state surface. It does not redefine it.

**Verification:** `pnpm vitest run apps/desktop/src/components/__tests__/Inspector.test.tsx` passes, `pnpm -r build` passes.

---

## Dependency Graph

```
Wave 0: Contract Freeze (operator, this document)
  ↓
Wave 1: SF5-101 (viewport) ‖ SF5-102 (multi-selection) [parallel]
  ↓
Wave 2: SF5-103 (canvas UX) ‖ SF5-104 (commands+inspector) [parallel]
  ↓
Wave 3: SF5-201 Verifier-Checklist [independent]
  ↓
Wave 4: SF5-301 Integrator [independent, after approval]
  ↓
Wave 5: SF5-401 Knowledge/Postmortem [independent]
```

## Human Gates

- **Gate A:** Contract freeze approval (this document) — before any worker launch
- **Gate B:** Mid-run amendment gate — if reconciliation or scope leak triggers
- **Gate C:** Pre-integration approval — after verifier passes
- **Gate D:** Post-run signoff — approve postmortem and any law changes

## Stop Drill Plan

**Target:** SF5-103 Canvas Interaction UX
**Procedure:**
1. Launch SF5-103 via SDK runtime
2. Wait until runtime envelope shows session running with first progress
3. Issue lawful stop via runtime adapter
4. Confirm: stop_reason=stopped, evidence preserved, hook logged, packet recoverable
5. Requeue and relaunch
6. Complete successfully

## Verification Checklist (SF5-201)

The verifier must confirm:
- [ ] No shell fallback used
- [ ] Runtime envelope exists for every worker session
- [ ] Tool profiles match roles (builders have Write, verifiers don't)
- [ ] Stop drill envelope is correct (stopped → restarted → completed)
- [ ] Reconciliation verdicts are clean or lawfully amended
- [ ] Single-select still works after multi-select upgrade
- [ ] Multi-select semantics are deterministic
- [ ] Duplicate/delete/nudge create coherent single history entries
- [ ] Zoom/pan/marquee behavior matches brief
- [ ] Keyboard shortcuts work and are test-covered
- [ ] pnpm build passes
- [ ] pnpm vitest run passes (all tests)
- [ ] cargo check passes

## Protected Files (integration-owned)
- `packages/state/src/index.ts`
- `packages/domain/src/index.ts`
- `packages/state/src/commandStore.ts` (command routing updates)
- `apps/desktop/src/App.tsx`
- `apps/desktop/src-tauri/src/lib.rs`

## Seam Files (integrator resolves)
- `packages/state/src/index.ts` — new store exports
- `packages/domain/src/index.ts` — new type exports
- `packages/state/src/commandStore.ts` — new command type routing
- `vitest.config.ts` — alias updates if needed

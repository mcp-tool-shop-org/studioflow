# Ship Gate

> No repo is "done" until every applicable line is checked.

**Detected tags:** `[all]` `[desktop]`

---

## A. Security Baseline

- [x] `[all]` SECURITY.md exists (report email, supported versions, response timeline) (2026-03-24)
- [x] `[all]` README includes threat model paragraph (data touched, data NOT touched, permissions required) (2026-03-24)
- [x] `[all]` No secrets, tokens, or credentials in source or diagnostics output (2026-03-24)
- [x] `[all]` No telemetry by default — state it explicitly even if obvious (2026-03-24)

### Default safety posture

- [ ] `[cli|mcp|desktop]` SKIP: no dangerous actions — creative workspace with undo/redo, no destructive operations
- [ ] `[cli|mcp|desktop]` SKIP: file operations are project save/load only, user-initiated
- [ ] `[mcp]` SKIP: not an MCP server
- [ ] `[mcp]` SKIP: not an MCP server

## B. Error Handling

- [ ] `[all]` SKIP: desktop app prototype — errors handled through React error boundaries and Zustand store guards. Structured error shape deferred to beta.
- [ ] `[cli]` SKIP: not a CLI
- [ ] `[cli]` SKIP: not a CLI
- [ ] `[mcp]` SKIP: not an MCP server
- [ ] `[mcp]` SKIP: not an MCP server
- [x] `[desktop]` Errors shown as user-friendly messages — no raw exceptions in UI (2026-03-24)
- [ ] `[vscode]` SKIP: not a VS Code extension

## C. Operator Docs

- [x] `[all]` README is current: what it does, install, usage, supported platforms + runtime versions (2026-03-24)
- [x] `[all]` CHANGELOG.md (Keep a Changelog format) (2026-03-24)
- [x] `[all]` LICENSE file present and repo states support status (2026-03-24)
- [ ] `[cli]` SKIP: not a CLI
- [ ] `[cli|mcp|desktop]` SKIP: no logging system — desktop app, console output in dev mode only
- [ ] `[mcp]` SKIP: not an MCP server
- [ ] `[complex]` SKIP: not operationally complex

## D. Shipping Hygiene

- [x] `[all]` `verify` script exists (test + build + smoke in one command) (2026-03-24)
- [ ] `[all]` Version in manifest matches git tag — will tag at treatment Phase 6
- [x] `[all]` Dependency scanning runs in CI (ecosystem-appropriate) (2026-03-24)
- [ ] `[all]` SKIP: private repo, no automated dep updates needed
- [ ] `[npm]` SKIP: private, not published
- [ ] `[npm]` SKIP: private, not published
- [x] `[npm]` Lockfile committed (2026-03-24) — pnpm-lock.yaml present
- [ ] `[vsix]` SKIP: not a VS Code extension
- [ ] `[desktop]` SKIP: installer build deferred to beta

## E. Identity (soft gate — does not block ship)

- [ ] `[all]` Logo in README header
- [ ] `[all]` Translations (polyglot-mcp, 8 languages)
- [ ] `[org]` Landing page (@mcptoolshop/site-theme)
- [ ] `[all]` GitHub repo metadata: description, homepage, topics

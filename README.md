<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/studioflow/actions"><img src="https://github.com/mcp-tool-shop-org/studioflow/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/studioflow/"><img src="https://img.shields.io/badge/Landing_Page-live-brightgreen" alt="Landing Page"></a>
</p>

# StudioFlow

Desktop creative workspace and multi-claude proving ground. A Tauri v2 desktop app for visual editing with domain-driven state management — built to prove independent AI agent execution through real product work.

## Quick Start

```bash
# Prerequisites: Rust (cargo), Node.js, pnpm
pnpm install
pnpm dev
```

## Architecture

```
studioflow/
  apps/desktop/          Tauri v2 + React desktop app
    src/components/      Canvas, Inspector, Toolbar, Workspace, LayersPanel
    src-tauri/           Rust backend
  packages/domain/       Domain types (layer, project, command, viewport, history)
  packages/state/        Zustand stores (document, selection, viewport, command, history)
```

## Stack

- **Tauri v2** — Rust backend, native desktop window
- **React** — UI components
- **Zustand** — State management with domain-driven stores
- **Vite** — Build tooling
- **Vitest** — Test framework (12 test files across domain + state + components)
- **pnpm workspaces** — Monorepo
- **Claude Agent SDK** — Multi-claude orchestration proving ground

## Multi-Claude Proving Ground

StudioFlow serves as the primary proving ground for multi-claude agent orchestration. Phase 5 demonstrated independent builder and verifier execution under the SDK runtime:

- 4 builder packets ran in isolated git worktrees
- 2 parallel waves executed with real role independence
- Verifier ran as a read-only session checking 20 verification points
- Integrator merged all work through a single controlled session

See `PHASE-5-CONTRACT.md` and `PHASE-6-POSTMORTEM.md` for the full proof run.

## Security

StudioFlow is a **local-only desktop application**. It does not connect to the internet or collect telemetry.

- **Reads:** Project files (JSON), canvas state, layer data
- **Writes:** Project save files to local storage only
- **Does NOT touch:** Network, cloud services, user accounts, analytics
- **No telemetry** — stated explicitly

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

## License

MIT

---

Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>

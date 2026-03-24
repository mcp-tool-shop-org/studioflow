# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-03-24

### Added
- Tauri v2 + React desktop application
- Domain-driven architecture: layer, project, command, viewport, history, selection types
- Zustand state stores: document, selection, viewport, command, history, persistence, workspace
- Canvas component with zoom, pan, and multi-selection
- Inspector panel with color editing
- Toolbar, LayersPanel, ProjectBar, RecentProjects components
- Color domain with picker integration
- Command pattern with undo/redo history
- Persistence store for project save/load
- 12 test files across domain, state, and component layers
- Multi-claude proving ground: Phase 5 (viewport + multi-selection) and Phase 6 (qualified pass)
- Claude Agent SDK integration for independent builder/verifier execution

---
title: Handbook
description: Everything you need to know about StudioFlow.
sidebar:
  order: 0
---

Welcome to the StudioFlow handbook. This covers setup, architecture, the multi-claude proving ground, and development reference.

## What's inside

- **[Getting Started](/studioflow/handbook/getting-started/)** -- Install, run, and understand the workspace
- **[Architecture](/studioflow/handbook/architecture/)** -- Domain-driven state, monorepo structure, Rust backend, and Tauri integration
- **[Reference](/studioflow/handbook/reference/)** -- Commands, keyboard shortcuts, test structure, and multi-claude proof runs
- **[Beginners Guide](/studioflow/handbook/beginners/)** -- Step-by-step walkthrough for first-time users and contributors

## What is StudioFlow?

StudioFlow is a desktop creative workspace built with Tauri v2, React, and domain-driven state management. It uses Zustand stores organized by domain concept (document, selection, viewport, history, persistence, workspace) with a central command dispatcher that routes 18 typed commands and supports full undo/redo.

The app serves as the primary proving ground for multi-claude agent orchestration -- demonstrating that independent AI agents can build real product features through isolated worktree execution.

[Back to landing page](/studioflow/)

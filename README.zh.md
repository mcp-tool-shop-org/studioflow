<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.md">English</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/studioflow/actions"><img src="https://github.com/mcp-tool-shop-org/studioflow/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/studioflow/"><img src="https://img.shields.io/badge/Landing_Page-live-brightgreen" alt="Landing Page"></a>
</p>

# StudioFlow

一个桌面创意工作空间，也是多 Claude 模型的测试平台。 这是一个基于 Tauri v2 的桌面应用程序，用于视觉编辑，采用领域驱动的状态管理——旨在通过实际的产品工作来验证独立的 AI 代理执行。

## 快速开始

```bash
# Prerequisites: Rust (cargo), Node.js, pnpm
pnpm install
pnpm dev
```

## 架构

```
studioflow/
  apps/desktop/          Tauri v2 + React desktop app
    src/components/      Canvas, Inspector, Toolbar, Workspace, LayersPanel
    src-tauri/           Rust backend
  packages/domain/       Domain types (layer, project, command, viewport, history)
  packages/state/        Zustand stores (document, selection, viewport, command, history)
```

## 技术栈

- **Tauri v2** — Rust 后端，原生桌面窗口
- **React** — UI 组件
- **Zustand** — 领域驱动的状态管理
- **Vite** — 构建工具
- **Vitest** — 测试框架（包含领域、状态和组件的 12 个测试文件）
- **pnpm workspaces** — 单仓库
- **Claude Agent SDK** — 多 Claude 模型编排的测试平台

## 多 Claude 模型测试平台

StudioFlow 是多 Claude 模型代理编排的主要测试平台。 第 5 阶段演示了在 SDK 运行时，独立的构建器和验证器执行：

- 4 个构建器任务在隔离的 Git 工作树中运行
- 2 个并行流程，具有真正的角色独立性
- 验证器以只读模式运行，检查 20 个验证点
- 集成器通过单个受控会话合并所有工作

有关完整的测试运行，请参阅 `PHASE-5-CONTRACT.md` 和 `PHASE-6-POSTMORTEM.md`。

## 安全性

StudioFlow 是一个**仅在本地运行的桌面应用程序**。 它不连接到互联网，也不收集任何遥测数据。

- **读取：** 项目文件（JSON）、画布状态、图层数据
- **写入：** 将项目保存文件写入本地存储
- **不涉及：** 网络、云服务、用户帐户、分析
- **无遥测数据**——明确声明

有关漏洞报告，请参阅 [SECURITY.md](SECURITY.md)。

## 许可证

MIT

---

由 <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> 构建。

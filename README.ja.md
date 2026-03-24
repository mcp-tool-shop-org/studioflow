<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/studioflow/actions"><img src="https://github.com/mcp-tool-shop-org/studioflow/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/studioflow/"><img src="https://img.shields.io/badge/Landing_Page-live-brightgreen" alt="Landing Page"></a>
</p>

# StudioFlow

デスクトップ環境でのクリエイティブ作業のためのツールであり、複数のAIエージェントの検証環境としても機能します。ドメイン駆動型ステート管理を備えた、Tauri v2をベースにしたデスクトップアプリケーションで、実際の製品開発を通じて、独立したAIエージェントの実行を検証することを目的としています。

## クイックスタート

```bash
# Prerequisites: Rust (cargo), Node.js, pnpm
pnpm install
pnpm dev
```

## アーキテクチャ

```
studioflow/
  apps/desktop/          Tauri v2 + React desktop app
    src/components/      Canvas, Inspector, Toolbar, Workspace, LayersPanel
    src-tauri/           Rust backend
  packages/domain/       Domain types (layer, project, command, viewport, history)
  packages/state/        Zustand stores (document, selection, viewport, command, history)
```

## 技術スタック

- **Tauri v2** — Rustによるバックエンド、ネイティブデスクトップウィンドウ
- **React** — UIコンポーネント
- **Zustand** — ドメイン駆動型のストアによるステート管理
- **Vite** — ビルドツール
- **Vitest** — テストフレームワーク（ドメイン、ステート、コンポーネントに関する12個のテストファイル）
- **pnpm workspaces** — モノレポ
- **Claude Agent SDK** — 複数のClaudeエージェントの連携検証環境

## マルチClaude検証環境

StudioFlowは、複数のClaudeエージェントの連携を検証するための主要な環境です。フェーズ5では、SDKランタイム下で、独立したビルダーとバリデータの実行を検証しました。

- 4つのビルダープロセスが、隔離されたGitワークツリー内で実行されました。
- 2つの並列処理が、実際の役割の独立性を持って実行されました。
- バリデータは、読み取り専用セッションとして実行され、20個の検証ポイントを確認しました。
- インテグレーターは、すべての作業を単一の制御されたセッションを通じて統合しました。

詳細については、`PHASE-5-CONTRACT.md` および `PHASE-6-POSTMORTEM.md` を参照してください。

## セキュリティ

StudioFlowは、**ローカルでのみ動作するデスクトップアプリケーション**です。インターネットに接続したり、テレメトリデータを収集したりしません。

- **読み込み:** プロジェクトファイル（JSON）、キャンバスの状態、レイヤデータ
- **書き込み:** プロジェクトの保存ファイルは、ローカルストレージのみに保存されます。
- **アクセスしません:** ネットワーク、クラウドサービス、ユーザーアカウント、分析
- **テレメトリは一切収集しません**（明示的に記載）

脆弱性に関する報告は、[SECURITY.md](SECURITY.md) を参照してください。

## ライセンス

MIT

---

開発: <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>

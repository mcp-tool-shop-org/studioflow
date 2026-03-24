<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.md">English</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/studioflow/actions"><img src="https://github.com/mcp-tool-shop-org/studioflow/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/studioflow/"><img src="https://img.shields.io/badge/Landing_Page-live-brightgreen" alt="Landing Page"></a>
</p>

# StudioFlow

Un ambiente di lavoro creativo per desktop e una piattaforma di test per l'integrazione di più agenti Claude. Un'applicazione desktop Tauri v2 per l'editing visivo con gestione dello stato basata sul dominio, progettata per dimostrare l'esecuzione indipendente di agenti di intelligenza artificiale attraverso attività reali.

## Guida Rapida

```bash
# Prerequisites: Rust (cargo), Node.js, pnpm
pnpm install
pnpm dev
```

## Architettura

```
studioflow/
  apps/desktop/          Tauri v2 + React desktop app
    src/components/      Canvas, Inspector, Toolbar, Workspace, LayersPanel
    src-tauri/           Rust backend
  packages/domain/       Domain types (layer, project, command, viewport, history)
  packages/state/        Zustand stores (document, selection, viewport, command, history)
```

## Tecnologie Utilizzate

- **Tauri v2** — Backend in Rust, finestra desktop nativa
- **React** — Componenti dell'interfaccia utente
- **Zustand** — Gestione dello stato con store basati sul dominio
- **Vite** — Strumenti di build
- **Vitest** — Framework di test (12 file di test che coprono dominio, stato e componenti)
- **pnpm workspaces** — Monorepo
- **Claude Agent SDK** — Piattaforma di test per l'orchestrazione di più agenti Claude

## Piattaforma di Test per Multi-Claude

StudioFlow funge da piattaforma principale per il test dell'orchestrazione di più agenti Claude. La fase 5 ha dimostrato l'esecuzione indipendente di builder e verifier all'interno dell'ambiente di runtime dell'SDK:

- 4 pacchetti di builder sono stati eseguiti in worktree Git isolati
- 2 esecuzioni parallele con vera indipendenza dei ruoli
- Il verifier è stato eseguito in una sessione di sola lettura, controllando 20 punti di verifica
- L'integratore ha unito tutti i lavori tramite una singola sessione controllata

Consultare i file `PHASE-5-CONTRACT.md` e `PHASE-6-POSTMORTEM.md` per l'esecuzione completa dei test.

## Sicurezza

StudioFlow è un'**applicazione desktop che funziona solo localmente**. Non si connette a Internet e non raccoglie dati di telemetria.

- **Lettura:** File di progetto (JSON), stato della tela, dati dei livelli
- **Scrittura:** File di salvataggio del progetto, solo nello storage locale
- **Non accede a:** Rete, servizi cloud, account utente, analisi
- **Nessuna telemetria** — esplicitamente dichiarato

Consultare [SECURITY.md](SECURITY.md) per la segnalazione di vulnerabilità.

## Licenza

MIT

---

Creato da <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>

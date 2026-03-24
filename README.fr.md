<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.md">English</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/studioflow/actions"><img src="https://github.com/mcp-tool-shop-org/studioflow/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/studioflow/"><img src="https://img.shields.io/badge/Landing_Page-live-brightgreen" alt="Landing Page"></a>
</p>

# StudioFlow

Espace de travail créatif pour ordinateur de bureau et plateforme de test pour l'utilisation de plusieurs agents Claude. Une application de bureau Tauri v2 pour l'édition visuelle avec une gestion d'état basée sur le domaine, conçue pour démontrer l'exécution indépendante d'agents d'IA à travers un travail concret.

## Démarrage rapide

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

## Technologies utilisées

- **Tauri v2** — Backend en Rust, fenêtre de bureau native
- **React** — Composants d'interface utilisateur
- **Zustand** — Gestion d'état avec des magasins basés sur le domaine
- **Vite** — Outils de construction
- **Vitest** — Framework de tests (12 fichiers de test répartis entre le domaine, l'état et les composants)
- **pnpm workspaces** — Monorepo
- **Claude Agent SDK** — Plateforme de test pour l'orchestration de plusieurs agents Claude

## Plateforme de test pour l'utilisation de plusieurs agents Claude

StudioFlow sert de plateforme principale pour l'orchestration de plusieurs agents Claude. La phase 5 a démontré l'exécution indépendante des constructeurs et des vérificateurs dans l'environnement d'exécution du SDK :

- 4 paquets de construction ont été exécutés dans des environnements Git isolés.
- 2 exécutions parallèles ont été réalisées avec une véritable indépendance des rôles.
- Le vérificateur a fonctionné en mode lecture seule, vérifiant 20 points de contrôle.
- L'intégrateur a fusionné tous les travaux via une seule session contrôlée.

Consultez les fichiers `PHASE-5-CONTRACT.md` et `PHASE-6-POSTMORTEM.md` pour l'ensemble des résultats de la phase de test.

## Sécurité

StudioFlow est une **application de bureau fonctionnant uniquement localement**. Elle ne se connecte pas à Internet et ne collecte aucune donnée de télémétrie.

- **Lecture :** Fichiers de projet (JSON), état de la zone de dessin, données des calques.
- **Écriture :** Fichiers de sauvegarde du projet, uniquement dans le stockage local.
- **Ne modifie pas :** Réseau, services cloud, comptes utilisateurs, analyses.
- **Aucune télémétrie** — déclaré explicitement.

Consultez le fichier [SECURITY.md](SECURITY.md) pour signaler les vulnérabilités.

## Licence

MIT

---

Développé par <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>

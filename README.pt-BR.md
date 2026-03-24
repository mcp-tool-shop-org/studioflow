<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.md">English</a>
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/studioflow/actions"><img src="https://github.com/mcp-tool-shop-org/studioflow/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/studioflow/"><img src="https://img.shields.io/badge/Landing_Page-live-brightgreen" alt="Landing Page"></a>
</p>

# StudioFlow

Um ambiente de trabalho criativo para desktop e um espaço de testes para a integração de múltiplos agentes Claude. Um aplicativo para desktop Tauri v2 para edição visual, com gerenciamento de estado baseado em domínio – projetado para demonstrar a execução independente de agentes de IA através de trabalho real em um produto.

## Início Rápido

```bash
# Prerequisites: Rust (cargo), Node.js, pnpm
pnpm install
pnpm dev
```

## Arquitetura

```
studioflow/
  apps/desktop/          Tauri v2 + React desktop app
    src/components/      Canvas, Inspector, Toolbar, Workspace, LayersPanel
    src-tauri/           Rust backend
  packages/domain/       Domain types (layer, project, command, viewport, history)
  packages/state/        Zustand stores (document, selection, viewport, command, history)
```

## Tecnologias Utilizadas

- **Tauri v2** — Backend em Rust, janela nativa para desktop.
- **React** — Componentes de interface do usuário.
- **Zustand** — Gerenciamento de estado com armazenamento baseado em domínio.
- **Vite** — Ferramentas de construção.
- **Vitest** — Framework de testes (12 arquivos de teste abrangendo domínio, estado e componentes).
- **pnpm workspaces** — Monorepo.
- **Claude Agent SDK** — Ambiente de testes para a orquestração de múltiplos agentes Claude.

## Ambiente de Testes para Múltiplos Agentes Claude

O StudioFlow serve como o principal ambiente de testes para a orquestração de múltiplos agentes Claude. A Fase 5 demonstrou a execução independente de construtores e verificadores sob o runtime do SDK:

- 4 pacotes de construção foram executados em árvores de trabalho Git isoladas.
- 2 ondas paralelas foram executadas com verdadeira independência de funções.
- O verificador foi executado em uma sessão somente leitura, verificando 20 pontos de verificação.
- O integrador uniu todo o trabalho através de uma única sessão controlada.

Consulte os arquivos `PHASE-5-CONTRACT.md` e `PHASE-6-POSTMORTEM.md` para a execução completa do teste.

## Segurança

O StudioFlow é um aplicativo para desktop que funciona **apenas localmente**. Ele não se conecta à internet nem coleta dados de telemetria.

- **Leitura:** Arquivos do projeto (JSON), estado da tela, dados das camadas.
- **Escrita:** Arquivos de salvamento do projeto, apenas no armazenamento local.
- **Não acessa:** Rede, serviços em nuvem, contas de usuário, análises.
- **Sem telemetria** — explicitamente declarado.

Consulte o arquivo [SECURITY.md](SECURITY.md) para relatar vulnerabilidades.

## Licença

MIT

---

Desenvolvido por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>

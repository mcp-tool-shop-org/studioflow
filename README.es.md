<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.md">English</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/studioflow/actions"><img src="https://github.com/mcp-tool-shop-org/studioflow/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/studioflow/"><img src="https://img.shields.io/badge/Landing_Page-live-brightgreen" alt="Landing Page"></a>
</p>

# StudioFlow

Entorno de trabajo creativo para escritorio y plataforma de pruebas para la integración de múltiples agentes Claude. Una aplicación de escritorio Tauri v2 para la edición visual con gestión de estado basada en dominios, diseñada para demostrar la ejecución independiente de agentes de IA a través de proyectos reales.

## Inicio rápido

```bash
# Prerequisites: Rust (cargo), Node.js, pnpm
pnpm install
pnpm dev
```

## Arquitectura

```
studioflow/
  apps/desktop/          Tauri v2 + React desktop app
    src/components/      Canvas, Inspector, Toolbar, Workspace, LayersPanel
    src-tauri/           Rust backend
  packages/domain/       Domain types (layer, project, command, viewport, history)
  packages/state/        Zustand stores (document, selection, viewport, command, history)
```

## Tecnologías utilizadas

- **Tauri v2**: Backend en Rust, ventana de escritorio nativa.
- **React**: Componentes de la interfaz de usuario.
- **Zustand**: Gestión de estado con almacenes basados en dominios.
- **Vite**: Herramientas de construcción.
- **Vitest**: Marco de pruebas (12 archivos de prueba que cubren dominios, estado y componentes).
- **pnpm workspaces**: Monorrepositorio.
- **Claude Agent SDK**: Plataforma de pruebas para la orquestación de múltiples agentes Claude.

## Plataforma de pruebas para la integración de múltiples agentes Claude

StudioFlow sirve como la plataforma principal para la orquestación de múltiples agentes Claude. La fase 5 demostró la ejecución independiente de los componentes de construcción y verificación dentro del entorno de ejecución del SDK:

- 4 paquetes de construcción se ejecutaron en árboles de trabajo de Git aislados.
- 2 ejecuciones paralelas con verdadera independencia de roles.
- El verificador se ejecutó en una sesión de solo lectura, verificando 20 puntos de verificación.
- El integrador fusionó todo el trabajo a través de una única sesión controlada.

Consulte los archivos `PHASE-5-CONTRACT.md` y `PHASE-6-POSTMORTEM.md` para ver la ejecución completa de la prueba.

## Seguridad

StudioFlow es una **aplicación de escritorio que solo funciona localmente**. No se conecta a Internet ni recopila datos de telemetría.

- **Lectura:** Archivos de proyecto (JSON), estado del lienzo, datos de las capas.
- **Escritura:** Archivos de guardado del proyecto, solo en el almacenamiento local.
- **No afecta:** Red, servicios en la nube, cuentas de usuario, análisis.
- **Sin telemetría**: Declarado explícitamente.

Consulte [SECURITY.md](SECURITY.md) para informar sobre vulnerabilidades.

## Licencia

MIT

---

Desarrollado por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>

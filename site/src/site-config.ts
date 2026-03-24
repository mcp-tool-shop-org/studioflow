import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'StudioFlow',
  description: 'Desktop creative workspace and multi-claude proving ground.',
  logoBadge: 'SF',
  brandName: 'studioflow',
  repoUrl: 'https://github.com/mcp-tool-shop-org/studioflow',
  footerText: 'MIT Licensed — built by <a href="https://mcp-tool-shop.github.io/" style="color:var(--color-muted);text-decoration:underline">MCP Tool Shop</a>',

  hero: {
    badge: 'v1.0.0',
    headline: 'StudioFlow',
    headlineAccent: 'create with agents.',
    description: 'A desktop creative workspace built to prove multi-claude agent orchestration through real product work. Tauri v2, React, domain-driven state, and the Claude Agent SDK.',
    primaryCta: { href: '#usage', label: 'Get started' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Prerequisites', code: 'Rust (cargo), Node.js, pnpm' },
      { label: 'Install', code: 'pnpm install' },
      { label: 'Run', code: 'pnpm dev' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'What it proves',
      subtitle: 'Multi-claude agent orchestration through real product work.',
      features: [
        { title: 'Independent execution', desc: 'Builder packets run in isolated git worktrees. No session can see another. Real parallel waves with role independence.' },
        { title: 'Domain-driven state', desc: 'Layer, project, command, viewport, history — typed domain models with Zustand stores and full undo/redo.' },
        { title: 'Verified by design', desc: '12 test files across domain, state, and components. Verifier runs as read-only independent session.' },
      ],
    },
    {
      kind: 'code-cards',
      id: 'usage',
      title: 'Quick start',
      cards: [
        { title: 'Run the app', code: '# Prerequisites: Rust (cargo), Node.js, pnpm\npnpm install\npnpm dev' },
        { title: 'Run tests', code: 'pnpm test\npnpm typecheck\npnpm verify' },
      ],
    },
  ],
};

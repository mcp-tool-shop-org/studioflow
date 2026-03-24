# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | Yes       |

## Reporting a Vulnerability

Email: **64996768+mcp-tool-shop@users.noreply.github.com**

Include:
- Description of the vulnerability
- Steps to reproduce
- Version affected
- Potential impact

### Response timeline

| Action | Target |
|--------|--------|
| Acknowledge report | 48 hours |
| Assess severity | 7 days |
| Release fix | 30 days |

## Scope

This is a **local desktop application**. It does not run a server or accept network connections.

- **Data touched:** Local filesystem — project files (JSON), canvas state, layer data
- **Data NOT touched:** No cloud services, no user accounts, no analytics
- **Permissions:** File read/write for project save/load only
- **No network egress** — fully offline application
- **No credentials** are stored or processed
- **No telemetry** is collected or sent

/**
 * Stub for @tauri-apps/plugin-dialog used in test environments.
 * Returns null by default so callers fall through to prompt() fallback.
 */
export async function open(_options?: unknown): Promise<string | null> {
  return null;
}

export async function save(_options?: unknown): Promise<string | null> {
  return null;
}

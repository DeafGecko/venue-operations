// src/lib/runtime-env.ts
// Reads a setting at runtime: process.env (Cloudflare exposes variables and secrets here when
// nodejs_compat is on, and local development uses .env), then the build-time value as a fallback.
export function runtimeEnv(key: string): string | undefined {
  const live = typeof process !== 'undefined' ? process.env?.[key] : undefined;
  const built = (import.meta.env as unknown as Record<string, string | undefined>)[key];
  return live || built || undefined;
}

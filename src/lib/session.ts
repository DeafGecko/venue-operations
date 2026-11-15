// src/lib/session.ts
// Signed admin session cookies. The cookie is "authenticated:<role>:<signature>", where the signature is
// an HMAC of the role using the admin password. A cookie that is not signed correctly is rejected.
import { runtimeEnv } from './runtime-env';

const encoder = new TextEncoder();
const ROLES = ['admin', 'manager', 'developer', 'viewer'];

async function signature(role: string): Promise<string | null> {
  const secret = runtimeEnv('ADMIN_PASSWORD');
  if (!secret) return null; // no password configured means no sessions can be created or accepted
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const bytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(role)));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function makeSessionValue(role: string): Promise<string | null> {
  const sig = await signature(role);
  return sig ? `authenticated:${role}:${sig}` : null;
}

// Returns the role if the cookie is genuine, otherwise null.
export async function verifySession(value: string | null | undefined): Promise<string | null> {
  if (!value) return null;
  const [kind, role, sig] = value.split(':');
  if (kind !== 'authenticated' || !role || !ROLES.includes(role) || !sig) return null;
  const expected = await signature(role);
  if (!expected || expected.length !== sig.length) return null;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0 ? role : null;
}

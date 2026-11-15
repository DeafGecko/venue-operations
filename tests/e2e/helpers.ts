import type { Page } from '@playwright/test';
import { createHmac } from 'crypto';
import { readFileSync } from 'fs';

// The page is hydrated by React; wait for network idle so clicks reach the handlers.
export async function openBooking(page: Page) {
  await page.goto('/book');
  await page.waitForLoadState('networkidle');
}

// A genuine admin session cookie for tests: the same signature the server checks (HMAC of the role with ADMIN_PASSWORD).
export function adminCookie(role: string): string {
  const env = readFileSync('.env', 'utf8');
  const password = env.split('\n').find((l) => l.startsWith('ADMIN_PASSWORD='))?.slice('ADMIN_PASSWORD='.length).trim() ?? '';
  const sig = createHmac('sha256', password).update(role).digest('hex');
  return `authenticated:${role}:${sig}`;
}

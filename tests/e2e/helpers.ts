import type { Page } from '@playwright/test';

// The booking form is a React island. Wait for hydration so clicks are handled by React, not just the server HTML.
export async function openBooking(page: Page) {
  await page.goto('/book');
  await page.waitForLoadState('networkidle');
}

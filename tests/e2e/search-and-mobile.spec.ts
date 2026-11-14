import { expect, test } from '@playwright/test';

test('public booking page has no horizontal scroll at phone width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/book');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('admin pages are marked noindex by header and robots.txt blocks them', async ({ request }) => {
  const login = await request.get('/admin/login');
  expect(login.headers()['x-robots-tag']).toContain('noindex');

  const robots = await request.get('/robots.txt');
  expect(await robots.text()).toContain('Disallow: /admin');
});

test('client confirmation page is noindex', async ({ page }) => {
  await page.goto('/client/dashboard?id=does-not-exist');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
});

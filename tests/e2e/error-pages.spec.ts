import { expect, test } from '@playwright/test';

test('unknown page shows our own 404 page with a way back', async ({ page }) => {
  const response = await page.goto('/this-page-does-not-exist');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Book an event' })).toHaveAttribute('href', '/book');
  await expect(page.getByRole('button', { name: 'Go back' })).toBeVisible();
});

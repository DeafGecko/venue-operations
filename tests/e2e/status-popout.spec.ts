import { expect, test } from '@playwright/test';
import { adminCookie } from './helpers';

test('status dropdown opens centered on screen and closes on Escape', async ({ context, page }, testInfo) => {
  test.skip(testInfo.project.name === 'phone', 'Checked on desktop; the same component is used on phones.');
  await context.addCookies([{ name: 'admin_session', value: adminCookie('manager'), url: 'http://localhost:4330' }]);
  await page.goto('/admin/tenants');
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: /add/i }).first().click();
  const statusTrigger = page.locator('label:has-text("Status") + button, div:has(> label:text-is("Status")) button[aria-haspopup="listbox"]').first();
  await statusTrigger.click();

  const listbox = page.getByRole('listbox');
  await expect(listbox).toBeVisible();
  const box = await listbox.boundingBox();
  const view = page.viewportSize()!;
  const cx = box!.x + box!.width / 2;
  const cy = box!.y + box!.height / 2;
  expect(Math.abs(cx - view.width / 2)).toBeLessThan(view.width * 0.05);
  expect(Math.abs(cy - view.height / 2)).toBeLessThan(view.height * 0.1);

  await page.keyboard.press('Escape');
  await expect(listbox).toHaveCount(0);
});

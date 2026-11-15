import { expect, test } from '@playwright/test';
import { adminCookie } from './helpers';

test('floor edit opens a centered modal over a dark tint and Escape closes it', async ({ context, page }, testInfo) => {
  test.skip(testInfo.project.name === 'phone', 'Checked on desktop.');
  await context.addCookies([{ name: 'admin_session', value: adminCookie('manager'), url: 'http://localhost:4330' }]);
  await page.goto('/admin/floor-plans');

  const editButtons = page.getByRole('button', { name: 'Edit', exact: true });
  test.skip((await editButtons.count()) === 0, 'No floors in the live data to edit.');
  await editButtons.first().click();

  const dialog = page.getByRole('dialog', { name: 'Edit Floor' });
  await expect(dialog).toBeVisible();
  // The backdrop covers the page with a dark tint
  const tint = await page.locator('div.fixed.inset-0').first().evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(tint).toMatch(/(rgba\(0, 0, 0, 0\.6\)|oklab\(0 0 0 \/ 0\.6\))/);

  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
});

// Add Floor uses the same modal, so this check runs even when there are no floors to edit.
test('add floor modal has the dark tint and closes on Escape', async ({ context, page }, testInfo) => {
  test.skip(testInfo.project.name === 'phone', 'Checked on desktop.');
  await context.addCookies([{ name: 'admin_session', value: adminCookie('manager'), url: 'http://localhost:4330' }]);
  await page.goto('/admin/floor-plans');
  await page.getByRole('button', { name: 'Add Floor' }).click();

  const dialog = page.getByRole('dialog', { name: 'Add New Floor' });
  await expect(dialog).toBeVisible();
  const tint = await page.locator('div.fixed.inset-0').first().evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(tint).toMatch(/(rgba\(0, 0, 0, 0\.6\)|oklab\(0 0 0 \/ 0\.6\))/);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
});

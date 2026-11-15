import { expect, test } from '@playwright/test';
import { adminCookie } from './helpers';

test.use({ storageState: undefined });

test('admin sees a delete button on each user and cancelling the centered dialog deletes nothing', async ({ context, page }) => {
  await context.addCookies([{ name: 'admin_session', value: adminCookie('admin'), url: 'http://localhost:4330' }]);

  let deleteCalled = false;
  await page.route('**/api/admin/users/**', (route) => {
    if (route.request().method() === 'DELETE') deleteCalled = true;
    return route.continue();
  });

  await page.goto('/admin/login-management');
  const deleteButtons = page.getByRole('button', { name: /^Delete / });
  await expect(deleteButtons.first()).toBeVisible();
  await deleteButtons.first().click();

  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('This cannot be undone.');
  await expect(dialog.getByRole('button', { name: 'Delete' })).toBeVisible();
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(dialog).toHaveCount(0);
  expect(deleteCalled).toBe(false);
});

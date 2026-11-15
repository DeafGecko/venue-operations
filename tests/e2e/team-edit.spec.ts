import { expect, test } from '@playwright/test';
import { adminCookie } from './helpers';

test('edit dialog opens from the Team & Access row and cancel saves nothing', async ({ context, page }) => {
  await context.addCookies([{ name: 'admin_session', value: adminCookie('admin'), url: 'http://localhost:4330' }]);

  let saveCalled = false;
  await page.route('**/api/admin/users/**', (route) => {
    if (route.request().method() === 'PUT') saveCalled = true;
    return route.continue();
  });

  await page.goto('/admin/login-management');
  const editButtons = page.getByRole('button', { name: /^Edit / });
  await expect(editButtons.first()).toBeVisible();
  await editButtons.first().click();

  const dialog = page.getByRole('dialog', { name: 'Edit User' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel('Full name')).not.toHaveValue('');
  await expect(dialog.getByLabel('Email')).not.toHaveValue('');
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(dialog).toHaveCount(0);
  expect(saveCalled).toBe(false);
});

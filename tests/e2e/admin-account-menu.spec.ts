import { expect, test } from '@playwright/test';

test.use({ storageState: undefined });

test.beforeEach(async ({ context }) => {
  await context.addCookies([
    { name: 'admin_session', value: 'authenticated:manager', url: 'http://localhost:4330' },
  ]);
});

test('account menu lists Settings, Account information, a disabled Change password, and Logout', async ({ page }, testInfo) => {
  // The header account menu is only rendered at lg and wider; phone users reach the same pages from the sidebar.
  test.skip(testInfo.project.name === 'phone', 'Account menu is hidden below the lg breakpoint.');
  await page.goto('/admin/dashboard');
  await page.getByRole('button', { name: 'Account menu' }).click();
  const menu = page.getByRole('menu', { name: 'Account menu' });

  await expect(menu.getByRole('menuitem', { name: /^Settings$/ })).toHaveAttribute('href', '/admin/settings');
  await expect(menu.getByRole('menuitem', { name: /Account information/ })).toHaveAttribute('href', '/admin/account');
  const changePassword = menu.getByRole('menuitem', { name: /Change password/ });
  await expect(changePassword).toHaveAttribute('aria-disabled', 'true');
  await expect(changePassword).not.toHaveAttribute('href', /.*/);
  await expect(menu.getByRole('menuitem', { name: /Logout/ })).toHaveAttribute('href', '/admin/logout');
});

test('settings page has a logout action', async ({ page }) => {
  await page.goto('/admin/settings');
  await expect(page.getByRole('link', { name: 'Log out', exact: true })).toHaveAttribute('href', '/admin/logout');
});

test('account information page shows the signed-in role', async ({ page }) => {
  await page.goto('/admin/account');
  await expect(page.getByRole('heading', { name: 'Account information' })).toBeVisible();
  await expect(page.getByText('Manager', { exact: true })).toBeVisible();
});

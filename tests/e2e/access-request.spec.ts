import { expect, test } from '@playwright/test';

test.describe('access code request endpoint', () => {
  test('rejects a request that does not name a page', async ({ request }) => {
    const response = await request.post('/api/access-request', { data: { page: '   ' } });
    expect(response.status()).toBe(400);
    expect(await response.json()).toMatchObject({ error: expect.stringContaining('Name the page') });
  });

  test('rejects a request that is not JSON', async ({ request }) => {
    const response = await request.post('/api/access-request', { headers: { 'Content-Type': 'text/plain' }, data: 'hello' });
    expect(response.status()).toBe(400);
  });

  test('locked popup offers a request button and shows no email address', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'phone', 'Desktop only.');
    await page.goto('/admin/dashboard');
    await page.locator('[data-locked-page]').first().click();
    const popup = page.locator('#locked-msg');
    await expect(popup).toBeVisible();
    await expect(page.locator('#request-code')).toBeVisible();
    await expect(popup).not.toContainText('@');
  });
});

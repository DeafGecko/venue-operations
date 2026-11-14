import { expect, test } from '@playwright/test';
import { openBooking } from './helpers';

// One task, end to end: create booking -> check calendar -> view bill -> read payment status.
// The create step is stubbed so no test data is written to Sanity. The admin pages read live data (read-only).
test('create booking, check calendar, view bill, read payment status', async ({ page, context }) => {
  // 1. Create booking (public form, API stubbed)
  let submitted: unknown = null;
  await page.route('**/api/create-booking', async (route) => {
    submitted = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, id: 'task-booking' }) });
  });
  await openBooking(page);
  await page.getByLabel('Full name *').fill('Ada Lovelace');
  await page.getByLabel('Email *').fill('ada@example.com');
  await page.getByLabel('Phone *').fill('(615) 555-0100');
  await page.getByRole('button', { name: 'Next: event details →' }).click();
  await page.getByLabel('Event date *').fill('2030-06-01');
  await page.getByLabel('Start time *').fill('18:00');
  await page.getByLabel('End time *').fill('23:00');
  await page.getByLabel('Number of guests *').fill('120');
  await page.getByRole('button', { name: 'Submit booking' }).click();
  await expect(page).toHaveURL(/\/client\/dashboard\?id=task-booking/);
  expect(submitted).toMatchObject({ clientName: 'Ada Lovelace', guestCount: 120 });

  // 2-3. Check calendar and view bills (admin, read-only)
  await context.addCookies([{ name: 'admin_session', value: 'authenticated:manager', url: 'http://localhost:4330' }]);
  await page.goto('/admin/calendar');
  await expect(page.getByRole('heading', { name: 'Calendar' }).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: /\d{4}/ }).first()).toBeVisible();

  await page.goto('/admin/bills');
  await expect(page.getByRole('heading', { name: 'Bills & Payments' })).toBeVisible();
  await expect(page.getByText('Outstanding', { exact: true })).toBeVisible();

});

// 4. Payment status on the confirmation page. Needs a real booking id, so it is separate and only runs when one is given.
test('read payment status on the confirmation page', async ({ page }) => {
  const bookingId = process.env.E2E_BOOKING_ID;
  test.skip(!bookingId, 'Set E2E_BOOKING_ID to a real booking document id to check payment status.');
  await page.goto(`/client/dashboard?id=${bookingId}`);
  await expect(page.getByText('Payment Status')).toBeVisible();
});

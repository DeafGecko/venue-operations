import { expect, test } from '@playwright/test';
import { openBooking } from './helpers';

const FUTURE_DATE = '2030-06-01';

async function fillStepOne(page: import('@playwright/test').Page) {
  await page.getByLabel('Full name *').fill('Ada Lovelace');
  await page.getByLabel('Email *').fill('ada@example.com');
  await page.getByLabel('Phone *').fill('(615) 555-0100');
}

async function fillStepTwo(page: import('@playwright/test').Page) {
  await page.getByLabel('Event date *').fill(FUTURE_DATE);
  await page.getByLabel('Start time *').fill('18:00');
  await page.getByLabel('End time *').fill('23:00');
  await page.getByLabel('Number of guests *').fill('120');
}

test.describe('public booking form', () => {
  test('page has a title, description, and visible primary action', async ({ page }) => {
    await openBooking(page);
    await expect(page).toHaveTitle(/Book Your Event \| The Factory/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.+/);
    const next = page.getByRole('button', { name: 'Next: event details →' });
    await expect(next).toBeVisible();
    // The button needs a real background; the undefined `primary` color made it transparent.
    await expect(next).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  });

  test('step one cannot advance while name or email is empty', async ({ page }) => {
    await openBooking(page);
    await page.getByRole('button', { name: 'Next: event details →' }).click();
    await expect(page.getByText('Step 1 of 2')).toBeVisible();
    await expect(page.getByLabel('Full name *')).toHaveJSProperty('validity.valid', false);
  });

  test('keyboard-only user can finish step one and reach step two with focus on the heading', async ({ page }) => {
    await openBooking(page);
    await page.getByLabel('Full name *').focus();
    await page.keyboard.type('Ada Lovelace');
    await page.keyboard.press('Tab'); // email
    await page.keyboard.type('ada@example.com');
    await page.getByLabel('Phone *').focus();
    await page.keyboard.type('(615) 555-0100');
    await page.keyboard.press('Tab'); // event type select
    await page.keyboard.press('Tab'); // next button
    await expect(page.getByRole('button', { name: 'Next: event details →' })).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(page.getByText('Step 2 of 2')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Request a Booking' })).toBeFocused();
  });

  test('focus indicator is visible on the focused input', async ({ page }) => {
    await openBooking(page);
    await page.getByLabel('Full name *').focus();
    const outline = await page.getByLabel('Full name *').evaluate((el) => {
      const s = getComputedStyle(el);
      return { outline: s.outlineStyle, shadow: s.boxShadow };
    });
    expect(outline.outline !== 'none' || outline.shadow !== 'none').toBe(true);
  });

  test('server validation errors appear next to the field, not in an alert box', async ({ page }) => {
    let dialogSeen = false;
    page.on('dialog', async (d) => {
      dialogSeen = true;
      await d.dismiss();
    });
    await page.route('**/api/create-booking', (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Please check the highlighted fields.',
          errors: { clientName: 'Enter your full name.' },
        }),
      }),
    );

    await openBooking(page);
    await fillStepOne(page);
    await page.getByRole('button', { name: 'Next: event details →' }).click();
    await fillStepTwo(page);
    await page.getByRole('button', { name: 'Submit booking' }).click();

    await expect(page.getByRole('alert')).toContainText('Please check the highlighted fields.');
    await expect(page.getByText('Enter your full name.')).toBeVisible();
    expect(dialogSeen).toBe(false);
  });

  test('network failure shows an inline message and keeps the entered data', async ({ page }) => {
    await page.route('**/api/create-booking', (route) => route.abort());
    await openBooking(page);
    await fillStepOne(page);
    await page.getByRole('button', { name: 'Next: event details →' }).click();
    await fillStepTwo(page);
    await page.getByRole('button', { name: 'Submit booking' }).click();

    await expect(page.getByRole('alert')).toContainText('We could not reach the server');
    await expect(page.getByLabel('Number of guests *')).toHaveValue('120');
  });

  test('successful submit moves to the confirmation page', async ({ page }) => {
    await page.route('**/api/create-booking', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, id: 'mock-id' }) }),
    );
    await openBooking(page);
    await fillStepOne(page);
    await page.getByRole('button', { name: 'Next: event details →' }).click();
    await fillStepTwo(page);
    await page.getByRole('button', { name: 'Submit booking' }).click();

    await expect(page).toHaveURL(/\/client\/dashboard\?id=mock-id/);
  });
});

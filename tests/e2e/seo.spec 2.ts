import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { adminCookie } from './helpers';

const SITE_URL = 'https://venue-operations-api.dwirog.workers.dev';

test.describe('public booking page', () => {
  test('has a title, description, canonical link, heading, and language', async ({ page }) => {
    await page.goto('/book');

    await expect(page).toHaveTitle(/The Factory/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Franklin, TN/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${SITE_URL}/book`);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    // Scoped to <main>: the Astro dev toolbar adds its own headings outside the page in dev mode.
    await expect(page.locator('main h1')).toHaveCount(1);
  });

  test('passes axe checks for document-level SEO and structure', async ({ page }) => {
    await page.goto('/book');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withRules(['document-title', 'html-has-lang', 'meta-viewport', 'page-has-heading-one', 'landmark-one-main'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});

test.describe('crawler files', () => {
  test('robots.txt blocks staff areas and points to the sitemap', async ({ request }) => {
    const response = await request.get('/robots.txt');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/plain');
    const body = await response.text();
    expect(body).toContain('Disallow: /admin');
    expect(body).toContain('Disallow: /api/admin');
    expect(body).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);
  });

  test('sitemap.xml lists the booking page and no staff pages', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('xml');
    const body = await response.text();
    expect(body).toContain(`<loc>${SITE_URL}/book</loc>`);
    expect(body).not.toContain('/admin');
  });
});

test.describe('staff pages', () => {
  test('are marked noindex in both the header and the meta tag, with a description', async ({ context, page, request }) => {
    await context.addCookies([{ name: 'admin_session', value: adminCookie('admin'), url: 'http://localhost:4330' }]);

    const response = await request.get('/admin/dashboard', { headers: { cookie: `admin_session=${adminCookie('admin')}` } });
    expect(response.headers()['x-robots-tag']).toContain('noindex');

    await page.goto('/admin/dashboard');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Not indexed/);
  });
});

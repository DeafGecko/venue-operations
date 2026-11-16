import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { writeFileSync, existsSync, readFileSync, mkdirSync } from 'fs';
import { adminCookie } from './helpers';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const PUBLIC = ['/book', '/client/login', '/admin/login', '/client/dashboard?id=none'];
const ADMIN = [
  '/admin/dashboard', '/admin', '/admin/calendar', '/admin/bills', '/admin/floor-plans',
  '/admin/login-management', '/admin/settings', '/admin/account', '/admin/tenants', '/admin/staff',
  '/admin/clients', '/admin/vendors', '/admin/contracts', '/admin/contacts', '/admin/qr-codes',
  '/admin/data-management',
];
const found: Record<string, string[]> = {};

async function audit(page: import('@playwright/test').Page, name: string) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  found[name] = results.violations.map((v) => `${v.id} [${v.impact}] x${v.nodes.length}: ${v.help}`);
  const file = '/private/tmp/claude-501/-Users-drogers-Library-Mobile-Documents-com-apple-CloudDocs-venue-operations/3d208cff-0d28-47cc-9829-24f1afc9cd22/scratchpad/wcag-report.json';
  const prev = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
  writeFileSync(file, JSON.stringify({ ...prev, [name]: found[name] }, null, 2));
  return results.violations;
}

for (const theme of ['light', 'dark']) {
  for (const path of PUBLIC) {
    test(`WCAG ${theme} ${path}`, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem('theme', t), theme);
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      expect(await audit(page, `${theme} ${path}`)).toEqual([]);
    });
  }
  for (const path of ADMIN) {
    test(`WCAG ${theme} ${path}`, async ({ context, page }) => {
      await context.addCookies([{ name: 'admin_session', value: adminCookie('admin'), url: 'http://localhost:4330' }]);
      await page.addInitScript((t) => localStorage.setItem('theme', t), theme);
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      expect(await audit(page, `${theme} ${path}`)).toEqual([]);
    });
  }
}

test.afterAll(() => {
  mkdirSync('/private/tmp/claude-501/-Users-drogers-Library-Mobile-Documents-com-apple-CloudDocs-venue-operations/3d208cff-0d28-47cc-9829-24f1afc9cd22/scratchpad', { recursive: true });
  writeFileSync('/private/tmp/claude-501/-Users-drogers-Library-Mobile-Documents-com-apple-CloudDocs-venue-operations/3d208cff-0d28-47cc-9829-24f1afc9cd22/scratchpad/wcag-report.json', JSON.stringify(found, null, 2));
});

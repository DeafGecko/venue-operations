import { describe, expect, it } from 'vitest';
import { PRIVATE_PATHS, PUBLIC_PAGES, SITE_URL, buildRobotsTxt, buildSitemapXml } from './seo';

describe('buildRobotsTxt', () => {
  const robots = buildRobotsTxt();

  it('blocks every staff path from crawling', () => {
    for (const path of PRIVATE_PATHS) expect(robots).toContain(`Disallow: ${path}`);
  });

  it('allows the public booking page', () => {
    expect(robots).toContain('Allow: /book');
  });

  it('points crawlers at the sitemap on the public address', () => {
    expect(robots).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);
  });
});

describe('buildSitemapXml', () => {
  const xml = buildSitemapXml();

  it('is a well-formed sitemap declaration', () => {
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml.trimEnd().endsWith('</urlset>')).toBe(true);
  });

  it('lists every public page with an absolute https address', () => {
    const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
    expect(locs).toEqual(PUBLIC_PAGES.map((p) => `${SITE_URL}${p.path}`));
    expect(locs.every((loc) => loc.startsWith('https://'))).toBe(true);
  });

  it('never lists a staff page', () => {
    for (const path of PRIVATE_PATHS) expect(xml).not.toContain(`${SITE_URL}${path}`);
  });
});

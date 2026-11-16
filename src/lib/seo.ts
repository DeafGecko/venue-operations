// src/lib/seo.ts
// One place for the public address, the default description, and the rules search engines read
// (robots.txt and sitemap.xml). Pages and endpoints import from here so they cannot drift apart.

export const SITE_URL = 'https://venue-operations-api.dwirog.workers.dev';

export const DEFAULT_DESCRIPTION =
  'The Factory event venue in Franklin, TN. Request a booking for your wedding, corporate event, birthday, or conference.';

// Staff pages. Never listed to search engines.
export const PRIVATE_PATHS = ['/admin', '/api/admin'];

// Public pages that should be indexed.
export const PUBLIC_PAGES = [{ path: '/book', changefreq: 'monthly', priority: '1.0' }];

export function buildRobotsTxt(): string {
  const lines = [
    'User-agent: *',
    'Allow: /book',
    ...PRIVATE_PATHS.map((p) => `Disallow: ${p}`),
    '',
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    '',
  ];
  return lines.join('\n');
}

export function buildSitemapXml(): string {
  const urls = PUBLIC_PAGES.map(
    (page) =>
      `  <url>\n    <loc>${SITE_URL}${page.path}</loc>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>`,
  );
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
}

// src/pages/sitemap.xml.ts
// Lists only public pages (see PUBLIC_PAGES in src/lib/seo.ts). Admin pages are never listed.
import type { APIRoute } from 'astro';
import { buildSitemapXml } from '../lib/seo';

export const prerender = false;

export const GET: APIRoute = () =>
  new Response(buildSitemapXml(), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });

// src/pages/robots.txt.ts
// Generated from src/lib/seo.ts so the rules match the sitemap and the admin noindex headers.
import type { APIRoute } from 'astro';
import { buildRobotsTxt } from '../lib/seo';

export const prerender = false;

export const GET: APIRoute = () =>
  new Response(buildRobotsTxt(), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });

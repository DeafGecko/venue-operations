// src/pages/api/admin/uploads.ts
// Generic image upload → Sanity asset store. Reusable by any admin feature (logo, avatar, photos).
// Body: raw file bytes; Content-Type: image/*; query param ?filename=
import type { APIRoute } from 'astro';
import { runtimeEnv } from '../../../lib/runtime-env';

export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get('content-type') ?? 'image/jpeg';
    if (!contentType.startsWith('image/')) {
      return new Response(JSON.stringify({ error: 'Only image uploads are allowed' }), { status: 400 });
    }
    const filename = new URL(request.url).searchParams.get('filename') ?? 'upload.jpg';
    const bytes    = await request.arrayBuffer();

    const projectId = runtimeEnv('SANITY_PROJECT_ID');
    const dataset   = runtimeEnv('SANITY_DATASET') || 'production';
    const token     = runtimeEnv('SANITY_API_TOKEN');

    const res = await fetch(
      `https://api.sanity.io/v2024-05-23/assets/images/${projectId}/${dataset}?filename=${encodeURIComponent(filename)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': contentType, Authorization: `Bearer ${token}` },
        body: bytes,
      }
    );
    if (!res.ok) {
      return new Response(JSON.stringify({ error: await res.text() }), { status: res.status });
    }
    const data = await res.json();
    const doc = data.document ?? data;
    return new Response(JSON.stringify({ assetId: doc._id, url: doc.url }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

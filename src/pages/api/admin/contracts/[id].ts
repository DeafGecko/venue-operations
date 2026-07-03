import type { APIRoute } from 'astro';
import { sanityClient } from '../../../../lib/sanity';

export const PATCH: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;
    if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });

    const contentType = request.headers.get('content-type') ?? '';

    // PDF upload — raw bytes
    if (contentType.startsWith('application/pdf') || contentType.startsWith('application/octet-stream')) {
      const filename = new URL(request.url).searchParams.get('filename') ?? 'contract.pdf';
      const bytes    = await request.arrayBuffer();
      const projectId = import.meta.env.SANITY_PROJECT_ID;
      const dataset   = import.meta.env.SANITY_DATASET || 'production';
      const token     = import.meta.env.SANITY_API_TOKEN;

      const assetRes = await fetch(
        `https://api.sanity.io/v2024-05-23/assets/files/${projectId}/${dataset}?filename=${encodeURIComponent(filename)}`,
        { method: 'POST', headers: { 'Content-Type': 'application/pdf', Authorization: `Bearer ${token}` }, body: bytes }
      );
      if (!assetRes.ok) {
        const text = await assetRes.text();
        return new Response(JSON.stringify({ error: text }), { status: assetRes.status });
      }
      const assetData = await assetRes.json();
      const doc = assetData.document ?? assetData;
      const assetRef = doc._id;

      await sanityClient.patch(id).set({
        pdfFile: { _type: 'file', asset: { _type: 'reference', _ref: assetRef } },
        status: 'signed',
        signedAt: new Date().toISOString(),
      }).commit();

      return new Response(JSON.stringify({ ok: true, assetRef }), { headers: { 'Content-Type': 'application/json' } });
    }

    // JSON patch — update fields
    const body = await request.json();
    const patch: Record<string, any> = {};
    const allowed = ['title', 'contractType', 'status', 'notes', 'startDate', 'endDate', 'sentAt', 'signedAt'];
    for (const key of allowed) {
      if (key in body) patch[key] = body[key];
    }
    if (body.status === 'sent' && !body.sentAt) patch.sentAt = new Date().toISOString();

    await sanityClient.patch(id).set(patch).commit();
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const { id } = params;
    if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });
    await sanityClient.delete(id);
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

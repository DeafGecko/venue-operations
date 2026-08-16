import type { APIRoute } from 'astro';
import { sanityClient } from '../../../../lib/sanity';

async function uploadToSanity(bytes: ArrayBuffer, contentType: string, filename: string) {
  const isImage = contentType.startsWith('image/');
  const kind    = isImage ? 'image' : 'file';
  const asset   = await sanityClient.assets.upload(kind, Buffer.from(bytes), {
    filename,
    contentType,
  });
  return { assetRef: asset._id, isImage };
}

export const PATCH: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;
    if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });

    const urlObj      = new URL(request.url);
    const contentType = request.headers.get('content-type') ?? '';
    const filename    = urlObj.searchParams.get('filename') ?? 'file';
    const label       = urlObj.searchParams.get('label') ?? filename;
    const mode        = urlObj.searchParams.get('mode') ?? 'signed-pdf'; // 'signed-pdf' | 'attachment'

    const isFile = contentType.startsWith('application/') || contentType.startsWith('image/');

    if (isFile) {
      const bytes = await request.arrayBuffer();
      const { assetRef, isImage } = await uploadToSanity(bytes, contentType, filename);
      const assetType = isImage ? 'image' : 'file';

      if (mode === 'attachment') {
        // append to attachments array
        await sanityClient.patch(id).append('attachments', [{
          _type: 'object',
          label,
          fileType: isImage ? 'image' : 'pdf',
          uploadedAt: new Date().toISOString(),
          file: { _type: assetType, asset: { _type: 'reference', _ref: assetRef } },
        }]).commit();
      } else {
        // signed PDF — set pdfFile and mark signed
        await sanityClient.patch(id).set({
          pdfFile: { _type: 'file', asset: { _type: 'reference', _ref: assetRef } },
          status: 'signed',
          signedAt: new Date().toISOString(),
        }).commit();
      }

      return new Response(JSON.stringify({ ok: true, assetRef }), { headers: { 'Content-Type': 'application/json' } });
    }

    // JSON patch — update scalar fields
    const body = await request.json();

    // delete an attachment by index
    if (typeof body.removeAttachmentIndex === 'number') {
      const contract = await sanityClient.fetch(`*[_id == $id][0]{ attachments }`, { id });
      const updated  = (contract.attachments ?? []).filter((_: any, i: number) => i !== body.removeAttachmentIndex);
      await sanityClient.patch(id).set({ attachments: updated }).commit();
      return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
    }

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

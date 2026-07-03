import type { APIRoute } from 'astro';
import { sanityClient } from '../../../../lib/sanity';

export const GET: APIRoute = async ({ url }) => {
  try {
    const contactId = url.searchParams.get('contactId');
    const query = contactId
      ? `*[_type == "contract" && contactId == $contactId] | order(_createdAt desc) {
           _id, _createdAt, contactId, contactName, contactEmail,
           contractType, title, status, notes, startDate, endDate, sentAt, signedAt,
           "pdfUrl": pdfFile.asset->url, "pdfName": pdfFile.asset->originalFilename
         }`
      : `*[_type == "contract"] | order(_createdAt desc) {
           _id, _createdAt, contactId, contactName, contactEmail,
           contractType, title, status, notes, startDate, endDate, sentAt, signedAt,
           "pdfUrl": pdfFile.asset->url, "pdfName": pdfFile.asset->originalFilename
         }`;
    const params = contactId ? { contactId } : {};
    const contracts = await sanityClient.fetch(query, params);
    return new Response(JSON.stringify(contracts), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { contactId, contactName, contactEmail, contractType, title, status, notes, startDate, endDate } = body;
    if (!contactId || !title) {
      return new Response(JSON.stringify({ error: 'contactId and title required' }), { status: 400 });
    }
    const doc = await sanityClient.create({
      _type: 'contract',
      contactId, contactName, contactEmail,
      contractType: contractType ?? 'rental',
      title,
      status: status ?? 'draft',
      notes: notes ?? '',
      startDate: startDate ?? null,
      endDate: endDate ?? null,
    });
    return new Response(JSON.stringify({ ok: true, _id: doc._id }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

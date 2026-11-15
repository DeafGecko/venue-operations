import type { APIRoute } from 'astro';
import { runtimeEnv } from '../../../../lib/runtime-env';
import { sanityClient } from '../../../../lib/sanity';

export const GET: APIRoute = async () => {
  const [clients, vendors, tenants, staff, bookings, overlays] = await Promise.all([
    sanityClient.fetch(
      `*[_type == "client"] | order(name asc) { _id, accountNumber, name, email, phone, address, company }`
    ),
    sanityClient.fetch(
      `*[_type == "vendor"] | order(name asc) { _id, accountNumber, name, contact, email, phone, serviceType }`
    ),
    sanityClient.fetch(
      `*[_type == "tenant"] | order(name asc) { _id, accountNumber, name, email, phone, businessType, unit, status }`
    ),
    sanityClient.fetch(
      `*[_type == "staff"] | order(name asc) { _id, accountNumber, name, role, email, phone, department, status }`
    ),
    sanityClient.fetch(
      `*[_type == "booking"] | order(clientName asc) { _id, accountNumber, clientName, email, phone, eventType, paymentStatus }`
    ),
    sanityClient.fetch(
      `*[_type == "contact"] { sourceType, sourceId, contactStatus, notes, tags, "avatarUrl": avatar.asset->url }`
    ),
  ]);

  // Build overlay map keyed by the primary sourceId (first seen per email)
  const overlayMap: Record<string, { contactStatus: string; notes?: string; tags?: string[]; avatarUrl?: string }> = {};
  for (const o of overlays) {
    overlayMap[o.sourceId] = { contactStatus: o.contactStatus, notes: o.notes, tags: o.tags, avatarUrl: o.avatarUrl };
  }

  // Flatten all raw records into a common shape
  type RawEntry = {
    id: string;
    sourceType: string;
    accountNumber?: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    contactPerson?: string;
    service?: string;
    defaultStatus: string;
  };

  const raw: RawEntry[] = [
    ...clients.map((c: any) => ({
      id: c._id, sourceType: 'client', accountNumber: c.accountNumber,
      name: c.name, email: c.email, phone: c.phone, address: c.address,
      service: c.company || null, defaultStatus: 'active',
    })),
    ...vendors.map((v: any) => ({
      id: v._id, sourceType: 'vendor', accountNumber: v.accountNumber,
      name: v.name, email: v.email, phone: v.phone,
      contactPerson: v.contact || null, service: v.serviceType || null, defaultStatus: 'active',
    })),
    ...tenants.map((t: any) => ({
      id: t._id, sourceType: 'tenant', accountNumber: t.accountNumber,
      name: t.name, email: t.email, phone: t.phone, address: t.unit || null,
      service: t.businessType || null, defaultStatus: t.status === 'expired' ? 'inactive' : 'active',
    })),
    ...staff.map((s: any) => ({
      id: s._id, sourceType: 'staff', accountNumber: s.accountNumber,
      name: s.name, email: s.email, phone: s.phone,
      service: s.department || s.role || null, defaultStatus: s.status === 'inactive' ? 'inactive' : 'active',
    })),
    ...bookings.map((b: any) => ({
      id: b._id, sourceType: 'booking', accountNumber: b.accountNumber,
      name: b.clientName, email: b.email, phone: b.phone,
      service: b.eventType || null, defaultStatus: 'active',
    })),
  ];

  // Deduplicate by email — group all roles onto one person
  // Key: lowercase email if present, else the sourceId (no-email records stay separate)
  const byKey: Record<string, typeof raw> = {};
  for (const r of raw) {
    const key = r.email ? r.email.toLowerCase().trim() : `__noemail__${r.id}`;
    if (!byKey[key]) byKey[key] = [];
    byKey[key].push(r);
  }

  const contacts = Object.values(byKey).map(group => {
    // Primary record = first one; use best available phone/address across group
    const primary = group[0];
    const phone   = group.find(r => r.phone)?.phone;
    const address = group.find(r => r.address)?.address;
    const contactPerson = group.find(r => r.contactPerson)?.contactPerson;

    // Roles: deduplicated list of { sourceType, service, id, accountNumber }
    const roles = group.map(r => ({
      sourceType: r.sourceType,
      service: r.service,
      id: r.id,
      accountNumber: r.accountNumber,
    }));

    // Overlay: prefer overlay keyed to any of the group's ids
    const overlayEntry = group.map(r => overlayMap[r.id]).find(Boolean);
    const defaultStatus = group.some(r => r.defaultStatus === 'active') ? 'active' : group[0].defaultStatus;

    return {
      id: primary.id,
      name: primary.name,
      email: primary.email,
      phone,
      address,
      contactPerson,
      roles,
      contactStatus: overlayEntry?.contactStatus ?? defaultStatus,
      notes: overlayEntry?.notes,
      tags: overlayEntry?.tags ?? [],
      avatarUrl: overlayEntry?.avatarUrl,
    };
  });

  // Sort by name
  contacts.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));

  return new Response(JSON.stringify(contacts), {
    headers: { 'Content-Type': 'application/json' },
  });
};

// PATCH /api/admin/contacts  { primaryId, contactStatus, notes, tags, avatarAssetId? }
export const PATCH: APIRoute = async ({ request }) => {
  try {
    const { primaryId, contactStatus, notes, tags, avatarAssetId } = await request.json();
    if (!primaryId || !contactStatus) {
      return new Response(JSON.stringify({ error: 'primaryId and contactStatus required' }), { status: 400 });
    }

    const patch: Record<string, any> = { contactStatus, notes, tags: tags ?? [] };
    if (avatarAssetId) {
      patch.avatar = { _type: 'image', asset: { _type: 'reference', _ref: avatarAssetId } };
    }

    const existing = await sanityClient.fetch(
      `*[_type == "contact" && sourceId == $sourceId][0]{ _id }`,
      { sourceId: primaryId }
    );

    if (existing?._id) {
      await sanityClient.patch(existing._id).set(patch).commit();
    } else {
      await sanityClient.create({ _type: 'contact', sourceType: 'merged', sourceId: primaryId, ...patch });
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

// POST /api/admin/contacts/avatar  — uploads image bytes to Sanity asset store
// Body: raw file bytes; Content-Type: image/*; query param ?filename=
export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get('content-type') ?? 'image/jpeg';
    const filename    = new URL(request.url).searchParams.get('filename') ?? 'avatar.jpg';
    const bytes       = await request.arrayBuffer();

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
      const text = await res.text();
      return new Response(JSON.stringify({ error: text }), { status: res.status });
    }
    const data = await res.json();
    // Sanity returns { document: { _id, url, ... } } for asset uploads
    const doc = data.document ?? data;
    const assetId = doc._id;
    // url may be omitted — construct it from the asset ref if needed
    const url = doc.url ?? `https://cdn.sanity.io/images/${projectId}/${dataset}/${assetId.replace('image-', '').replace(/-([a-z]+)$/, '.$1')}`;
    return new Response(JSON.stringify({ assetId, url }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

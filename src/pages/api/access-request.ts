// POST /api/access-request: a visitor asks for the access code for a locked page.
// The request is emailed to ACCESS_REQUEST_EMAIL (set as a secret, not in the code).
import type { APIRoute } from 'astro';
import { runtimeEnv } from '../../lib/runtime-env';
import { sendAccessRequestEmail } from '../../lib/email';

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async ({ request }) => {
  let data: { page?: unknown; name?: unknown; note?: unknown };
  try {
    data = await request.json();
  } catch {
    return json({ error: 'Send the request as JSON.' }, 400);
  }

  const page = String(data.page ?? '').trim().slice(0, 60);
  const name = String(data.name ?? '').trim().slice(0, 120);
  const note = String(data.note ?? '').trim().slice(0, 500);
  if (!page) return json({ error: 'Name the page you want to view.' }, 400);

  const to = runtimeEnv('ACCESS_REQUEST_EMAIL');
  const apiKey = runtimeEnv('RESEND_API_KEY') ?? '';
  if (!to || !apiKey) return json({ error: 'Requests are not set up yet. Try again later.' }, 503);

  try {
    await sendAccessRequestEmail({ to, page, name, note }, apiKey, runtimeEnv('FROM_EMAIL'));
  } catch (err) {
    console.error('Access request email failed:', err);
    return json({ error: 'The request could not be sent. Try again later.' }, 502);
  }
  return json({ ok: true }, 202);
};

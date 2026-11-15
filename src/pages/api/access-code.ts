// POST /api/access-code: a visitor enters the access code to view the admin (read-only).
// The code is the ACCESS_CODE secret; a correct code gives the view-only "viewer" session.
import type { APIRoute } from 'astro';
import { runtimeEnv } from '../../lib/runtime-env';
import { makeSessionValue } from '../../lib/session';

function sameText(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const given = String(form.get('code') ?? '').trim();
  const expected = runtimeEnv('ACCESS_CODE') ?? '';
  const session = expected && sameText(given, expected) ? await makeSessionValue('viewer') : null;

  if (!session) {
    return new Response(null, { status: 303, headers: { Location: '/admin/dashboard?code=wrong' } });
  }
  return new Response(null, {
    status: 303,
    headers: {
      Location: '/admin/dashboard',
      'Set-Cookie': `admin_session=${session}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`,
    },
  });
};

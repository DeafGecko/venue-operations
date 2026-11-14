// src/pages/api/admin/users/[id].ts
import type { APIRoute } from 'astro';
import { sanityClient } from '../../../../lib/sanity';

// Deleting an account is admin-only, on top of the write-role check in middleware.
export const DELETE: APIRoute = async ({ params, cookies }) => {
  const role = (cookies.get('admin_session')?.value ?? '').split(':')[1];
  if (role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Only admins can delete users.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { id } = params;
    if (!id) return new Response(JSON.stringify({ error: 'Missing ID' }), { status: 400 });

    const user = await sanityClient.fetch(`*[_type == "adminUser" && _id == $id][0]{ _id }`, { id });
    if (!user) return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });

    await sanityClient.delete(id);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return new Response(JSON.stringify({ error: 'Could not delete this user. Try again.' }), { status: 500 });
  }
};

const ROLES = ['admin', 'developer', 'manager', 'viewer'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const PUT: APIRoute = async ({ params, request, cookies }) => {
  try {
    const { id } = params;
    if (!id) return jsonError('Missing ID', 400);

    const body = await request.json();
    const role = (cookies.get('admin_session')?.value ?? '').split(':')[1];
    const updateData: any = {};

    // Name and email identify the account, so only admins change them.
    if ('name' in body || 'email' in body) {
      if (role !== 'admin') return jsonError('Only admins can change a user’s name or email.', 403);

      const name = typeof body.name === 'string' ? body.name.trim() : '';
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      if (!name || name.length > 120) return jsonError('Enter a name up to 120 characters.', 400);
      if (!EMAIL_PATTERN.test(email)) return jsonError('Enter a valid email address.', 400);

      const taken = await sanityClient.fetch(
        `count(*[_type == "adminUser" && email == $email && _id != $id])`,
        { email, id },
      );
      if (taken > 0) return jsonError('Another user already has this email.', 409);

      updateData.name = name;
      updateData.email = email;
    }
    if ('role' in body) {
      if (!ROLES.includes(body.role)) return jsonError('Choose a valid role.', 400);
      updateData.role = body.role;
    }
    if ('isActive' in body) updateData.isActive = body.isActive;

    const updated = await sanityClient.patch(id).set(updateData).commit();
    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Update user error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

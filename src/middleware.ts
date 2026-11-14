import { defineMiddleware } from 'astro:middleware';
import type { MiddlewareHandler } from 'astro';

const PUBLIC_PATHS = ['/admin/login', '/admin/forgot-password', '/admin/reset-password', '/api/admin/auth'];

// Write routes any signed-in user may call for their own account
const SELF_SERVICE_PATHS = ['/api/admin/users/change-password'];

function isAdminPath(pathname: string) {
  return pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
}

// Admin pages are for staff, not search engines. Every admin response, including redirects, is marked noindex.
export const onRequest = defineMiddleware(async (context, next) => {
  if (!isAdminPath(new URL(context.request.url).pathname)) {
    return next();
  }

  const response = await guardAdmin(context, next);
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
});

async function guardAdmin({ request, cookies, redirect }: Parameters<MiddlewareHandler>[0], next: Parameters<MiddlewareHandler>[1]) {
  const url = new URL(request.url);

  if (PUBLIC_PATHS.some((p) => url.pathname.startsWith(p))) {
    return next();
  }

  const session = cookies.get('admin_session');
  const sessionValue = session?.value ?? '';

  if (!sessionValue.startsWith('authenticated:')) {
    return redirect('/admin/login');
  }

  const role = sessionValue.split(':')[1]; // admin | manager | developer | viewer

  // Every write to the admin API is admin or manager only (README: developer and viewer are view-only).
  // The one exception is changing your own password, which any signed-in user may do.
  const isWriteApi = request.method !== 'GET' && request.method !== 'HEAD' &&
    url.pathname.startsWith('/api/admin') &&
    !SELF_SERVICE_PATHS.some((p) => url.pathname.startsWith(p));

  if (isWriteApi && role !== 'admin' && role !== 'manager') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Login management page: admin only
  if (url.pathname.startsWith('/admin/login-management') && role !== 'admin') {
    return redirect('/admin/dashboard');
  }

  const response = await next();
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
}

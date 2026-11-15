import { defineMiddleware } from 'astro:middleware';
import type { MiddlewareHandler } from 'astro';
import { verifySession } from './lib/session';

const PUBLIC_PATHS = ['/admin/login', '/admin/forgot-password', '/admin/reset-password', '/api/admin/auth'];

// Write routes any signed-in user may call for their own account
const SELF_SERVICE_PATHS = ['/api/admin/users/change-password'];

function isAdminPath(pathname: string) {
  return pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
}

// Admin pages are for staff, not search engines. Every admin response, including redirects, is marked noindex.
// Live build with DEMO_ONLY=true: only the demo and static files are served. Everything else goes to the demo.
// The live address opens straight to the demo. Visitors who are not signed in cannot reach the admin
// (they go to the demo instead); signing in at /admin/login still works.
const LIVE_HOST = 'venue-operations-api.dwirog.workers.dev';

export const onRequest = defineMiddleware(async (context, next) => {
  // A plain /admin address opens the dashboard. (The bookings page is /admin/ with the trailing slash.)
  if (new URL(context.request.url).pathname === '/admin') return context.redirect('/admin/dashboard');
  const liveUrl = new URL(context.request.url);
  if (liveUrl.hostname === LIVE_HOST) {
    const path = liveUrl.pathname;
    if (path === '/' || path === '/demo' || path.startsWith('/demo/')) return context.redirect('/admin/dashboard');
    const signedIn = !!(await verifySession(context.cookies.get('admin_session')?.value));
    const isAdminArea = path.startsWith('/admin') || path.startsWith('/api/admin');
    const isLoginArea = path.startsWith('/admin/login') || path.startsWith('/api/admin/auth') || path.startsWith('/admin/forgot-password') || path.startsWith('/admin/reset-password');
    const isPublicDashboard = ['/admin/dashboard', '/admin/calendar'].includes(path) && context.request.method === 'GET';
    if (isAdminArea && !isLoginArea && !signedIn && !isPublicDashboard) return context.redirect('/admin/login');
  }
  if (!isAdminPath(new URL(context.request.url).pathname)) {
    return next();
  }

  const response = await guardAdmin(context, next);
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
});

async function guardAdmin(context: Parameters<MiddlewareHandler>[0], next: Parameters<MiddlewareHandler>[1]) {
  const { request, cookies, redirect } = context;
  const url = new URL(request.url);

  if (PUBLIC_PATHS.some((p) => url.pathname.startsWith(p))) {
    return next();
  }

  const session = cookies.get('admin_session');
  const role = await verifySession(session?.value); // admin | manager | developer | viewer, only if the signature is genuine

  if (!role) {
    // Read-only public view: anyone can look at the dashboard and calendar. Nothing else is open without signing in.
    if (request.method === 'GET' && ['/admin/dashboard', '/admin/calendar'].includes(new URL(request.url).pathname)) {
      (context.locals as unknown as { anonymousViewer?: boolean }).anonymousViewer = true;
      return next();
    }
    return redirect('/admin/login');
  }

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

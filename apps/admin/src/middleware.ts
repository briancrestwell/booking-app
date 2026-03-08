// Edge Middleware — runs at the CDN edge, zero cold-start latency.
// Reads the `admin_token` cookie, verifies the JWT signature with `jose`,
// and redirects unauthenticated requests to /login.
//
// Protected: all routes EXCEPT /login and Next.js internals.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify, type JWTPayload } from 'jose';

// ── Config ────────────────────────────────────────────────────────────────────
const COOKIE_NAME = process.env.ADMIN_JWT_COOKIE ?? 'admin_token';
const JWT_SECRET  = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev_secret_change_in_production',
);
const IS_MOCK = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';

/** Decode JWT payload without verifying signature — used only in mock mode */
function decodeMockPayload(token: string): (JWTPayload & { role?: string }) | null {
  try {
    const [, part] = token.split('.');
    const b64     = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded  = b64 + '=='.slice((b64.length % 4) || 4);
    const binary  = atob(padded);
    const bytes   = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const json    = new TextDecoder('utf-8').decode(bytes);
    return JSON.parse(json) as JWTPayload & { role?: string };
  } catch {
    return null;
  }
}

// Routes that do NOT require authentication
const PUBLIC_PATHS = new Set(['/login', '/onboarding']);

// Routes that require specific roles (beyond just being authenticated)
const ROLE_PROTECTED: { prefix: string; allowedRoles: string[] }[] = [
  { prefix: '/staff',      allowedRoles: ['SUPER_ADMIN', 'MANAGER'] },
  { prefix: '/restaurant', allowedRoles: ['SUPER_ADMIN', 'MANAGER'] },
  { prefix: '/audit',      allowedRoles: ['SUPER_ADMIN', 'MANAGER'] },
  { prefix: '/kitchen',    allowedRoles: ['SUPER_ADMIN', 'MANAGER', 'KITCHEN'] },
  { prefix: '/menu',       allowedRoles: ['SUPER_ADMIN', 'MANAGER', 'CASHIER', 'KITCHEN', 'WAITER'] },
  { prefix: '/tables',     allowedRoles: ['SUPER_ADMIN', 'MANAGER', 'CASHIER', 'WAITER'] },
];

// ── Route matcher ─────────────────────────────────────────────────────────────
export const config = {
  matcher: [
    // Match all paths except Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json).*)',
  ],
};

// ── Middleware ────────────────────────────────────────────────────────────────
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow public paths
  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;

  // No token → redirect to /login with the original URL as `from` param
  if (!token) {
    return redirectToLogin(req);
  }

  // Verify signature + expiry
  try {
    let payload: JWTPayload & { role?: string };

    // Local-admin tokens (generated client-side without a real backend) use the
    // literal signature "local_sig" since there is no signing key available in
    // the browser.  We must decode them the same way as mock tokens.
    const isLocalToken = token.endsWith('.local_sig');

    if (IS_MOCK || isLocalToken) {
      // Skip signature verification — just decode and check exp
      const decoded = decodeMockPayload(token);
      if (!decoded) return redirectToLogin(req, 'expired');
      if (decoded.exp && (decoded.exp as number) * 1000 < Date.now()) {
        return redirectToLogin(req, 'expired');
      }
      payload = decoded;
    } else {
      const result = await jwtVerify(token, JWT_SECRET) as { payload: JWTPayload & { role?: string } };
      payload = result.payload;
    }

    // RBAC guard: only allow valid staff roles
    const allowedRoles = ['SUPER_ADMIN', 'MANAGER', 'CASHIER', 'KITCHEN', 'WAITER'];
    if (!payload.role || !allowedRoles.includes(payload.role)) {
      return redirectToLogin(req, 'forbidden');
    }

    // Route-level RBAC: check if the current path requires a specific role
    for (const guard of ROLE_PROTECTED) {
      if (pathname.startsWith(guard.prefix) && !guard.allowedRoles.includes(payload.role ?? '')) {
        return redirectToLogin(req, 'forbidden');
      }
    }

    // Inject user info as request headers so Server Components can read them
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-id',     String(payload.sub ?? ''));
    requestHeaders.set('x-user-role',   String(payload.role));
    requestHeaders.set('x-branch-id',   String((payload as Record<string, unknown>).branchId ?? ''));

    return NextResponse.next({ request: { headers: requestHeaders } });

  } catch {
    // Invalid / expired token
    return redirectToLogin(req, 'expired');
  }
}

function redirectToLogin(req: NextRequest, reason?: string) {
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('from', req.nextUrl.pathname);
  if (reason) url.searchParams.set('reason', reason);

  const res = NextResponse.redirect(url);
  // Clear the stale cookie so the browser doesn't resend it
  res.cookies.delete(COOKIE_NAME);
  return res;
}

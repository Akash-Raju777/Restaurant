// frontend/middleware.ts
// Next.js middleware for role-based route protection.
// Runs on the server before page rendering. Reads auth cookies (set on login)
// to enforce access control without relying on client-side localStorage.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const CUSTOMER_COOKIE = 'ember_token_customer';
const ADMIN_COOKIE = 'ember_token_admin';

// Customer-protected routes: require a valid customer session
const CUSTOMER_PROTECTED_PREFIXES = ['/orders', '/checkout', '/profile', '/cart'];

// Admin-protected routes: require a valid admin session
const ADMIN_PROTECTED_PREFIXES = ['/admin'];

// Public routes that authenticated users should be redirected away from
const LOGIN_PAGE = '/';

function hasCookie(request: NextRequest, name: string): boolean {
  return request.cookies.has(name);
}

function isCustomerRoute(pathname: string): boolean {
  return CUSTOMER_PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function isAdminRoute(pathname: string): boolean {
  return ADMIN_PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function isPublicRoute(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname === '/home' ||
    pathname === '/menu' ||
    pathname === '/gallery' ||
    pathname === '/about' ||
    pathname === '/offers' ||
    pathname === '/contact' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon.ico')
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasCustomerToken = hasCookie(request, CUSTOMER_COOKIE);
  const hasAdminToken = hasCookie(request, ADMIN_COOKIE);

  // --- Admin route protection ---
  if (isAdminRoute(pathname)) {
    if (!hasAdminToken) {
      // Not logged in as admin: redirect to login
      const loginUrl = new URL(LOGIN_PAGE, request.url);
      loginUrl.searchParams.set('redirect', pathname);
      loginUrl.searchParams.set('tab', 'admin');
      return NextResponse.redirect(loginUrl);
    }
    // Admin token present: allow access
    return NextResponse.next();
  }

  // --- Customer route protection ---
  if (isCustomerRoute(pathname)) {
    if (!hasCustomerToken) {
      // Not logged in as customer: redirect to login
      const loginUrl = new URL(LOGIN_PAGE, request.url);
      loginUrl.searchParams.set('redirect', pathname);
      loginUrl.searchParams.set('tab', 'customer');
      return NextResponse.redirect(loginUrl);
    }
    // Customer token present: allow access (even if admin also logged in)
    return NextResponse.next();
  }

  // --- Login page: redirect if already authenticated ---
  if (pathname === LOGIN_PAGE) {
    const redirectTo = request.nextUrl.searchParams.get('redirect') || undefined;
    const requestedTab = request.nextUrl.searchParams.get('tab') || undefined;

    if (hasAdminToken && requestedTab !== 'customer') {
      // Already logged in as admin: go to admin dashboard
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    if (hasCustomerToken && requestedTab !== 'admin') {
      // Already logged in as customer: go to home (or stored redirect)
      const target = redirectTo || '/home';
      return NextResponse.redirect(new URL(target, request.url));
    }
    // Not authenticated: show login page
    return NextResponse.next();
  }

  // --- Public routes: allow access ---
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // --- Fallback: allow all other routes (e.g., static assets, unknown paths) ---
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     * - api routes (handled by backend Spring Security)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};

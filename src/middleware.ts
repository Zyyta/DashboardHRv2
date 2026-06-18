// =============================================================================
// Next.js Middleware — Route Protection & RBAC
// Uses edge-compatible auth config (no Prisma)
// =============================================================================

import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const { auth } = NextAuth(authConfig);

// Wrap NextAuth middleware to forward the current pathname as a request header
// so server-component layouts (which can't read URL directly) can check it.
export default auth((req: NextRequest) => {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', req.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
});

export const config = {
  // Match all routes except static files and API routes
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)'],
};

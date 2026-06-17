// =============================================================================
// Next.js Middleware — Route Protection & RBAC
// Uses edge-compatible auth config (no Prisma)
// =============================================================================

import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Match all routes except static files and API routes
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)'],
};

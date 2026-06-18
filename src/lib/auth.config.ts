// =============================================================================
// NextAuth v5 — Edge-compatible configuration
// Used by middleware.ts (runs in Edge Runtime where Prisma is not available)
// =============================================================================

import type { NextAuthConfig } from 'next-auth';
import type { UserRole } from '@prisma/client';

export const authConfig = {
  pages: {
    signIn: '/login',
    newUser: '/register',
  },
  callbacks: {
    // Edge-compatible: copies JWT claims → session.user so middleware can read role.
    // No Prisma here — only reads from the already-decoded token.
    session({ session, token }) {
      if (session.user && token) {
        session.user.role = (token.role ?? 'EMPLOYEE') as UserRole;
        session.user.organizationId = (token.organizationId as string | null) ?? null;
        session.user.organizationName = (token.organizationName as string | null) ?? null;
      }
      return session;
    },

    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      const isOnAdmin = nextUrl.pathname.startsWith('/admin');
      const isOnAuth = nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/register');

      if (isOnAdmin) {
        if (!isLoggedIn) return Response.redirect(new URL('/login', nextUrl));
        if (role !== 'ORG_ADMIN' && role !== 'SUPER_ADMIN') {
          return Response.redirect(new URL('/dashboard', nextUrl));
        }
        return true;
      }

      if (isOnDashboard) {
        return isLoggedIn;
      }

      if (isOnAuth && isLoggedIn) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }

      return true;
    },
  },
  providers: [], // Configured in auth.ts (not edge-compatible due to Prisma)
} satisfies NextAuthConfig;

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
        session.user.role = (token.role ?? 'ORG_MEMBER') as UserRole;
        session.user.organizationId = (token.organizationId as string | null) ?? null;
        session.user.organizationName = (token.organizationName as string | null) ?? null;
      }
      return session;
    },

    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role;
      const path = nextUrl.pathname;
      const isOnDashboard = path.startsWith('/dashboard');
      const isOnAdmin = path.startsWith('/admin');
      const isOnBilling = path.startsWith('/dashboard/billing');
      const isOnAuth = path.startsWith('/login') || path.startsWith('/register');

      if (isOnAdmin) {
        if (!isLoggedIn) return Response.redirect(new URL('/login', nextUrl));
        if (role !== 'ORG_ADMIN' && role !== 'SUPER_ADMIN') {
          return Response.redirect(new URL('/dashboard', nextUrl));
        }
        return true;
      }

      // Billing is ORG_ADMIN only — ORG_MEMBER has no billing access
      if (isOnBilling) {
        if (!isLoggedIn) return false;
        if (role === 'ORG_MEMBER' || role === 'EMPLOYEE') {
          return Response.redirect(new URL('/dashboard', nextUrl));
        }
        return true;
      }

      if (isOnDashboard) {
        if (!isLoggedIn) return false;
        // Legacy EMPLOYEE accounts have no dashboard access
        if (role === 'EMPLOYEE') return Response.redirect(new URL('/unauthorized', nextUrl));
        return true;
      }

      if (isOnAuth && isLoggedIn) {
        if (role === 'EMPLOYEE') return Response.redirect(new URL('/unauthorized', nextUrl));
        return Response.redirect(new URL('/dashboard', nextUrl));
      }

      return true;
    },
  },
  providers: [], // Configured in auth.ts (not edge-compatible due to Prisma)
} satisfies NextAuthConfig;

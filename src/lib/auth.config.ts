// =============================================================================
// NextAuth v5 — Edge-compatible configuration
// Used by middleware.ts (runs in Edge Runtime where Prisma is not available)
// =============================================================================

import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
    newUser: '/register',
  },
  callbacks: {
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

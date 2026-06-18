// =============================================================================
// NextAuth v5 — Main Auth Configuration
// Includes Prisma adapter and credential provider
// =============================================================================

import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/lib/auth.config';
import type { UserRole } from '@prisma/client';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' }, // JWT for credentials provider
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { organization: true },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          organizationId: user.organizationId,
          organizationName: user.organization?.name ?? null,
        };
      },
    }),
  ],
  callbacks: {
    // Spread the edge-compatible callbacks (session + authorized) from authConfig,
    // then add the jwt callback which needs Prisma and cannot run at the edge.
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        // Initial sign-in: use values from authorize()
        token.role = user.role;
        token.organizationId = user.organizationId;
        token.organizationName = user.organizationName;
      } else if (token.sub) {
        // Subsequent requests: re-fetch role so changes take effect without re-login
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true, organizationId: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.organizationId = dbUser.organizationId;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (!token.sub) throw new Error('Invalid token: missing sub');
        session.user.id = token.sub;
        session.user.role = token.role as UserRole;
        session.user.organizationId = token.organizationId as string | null;
        session.user.organizationName = token.organizationName as string | null;
      }
      return session;
    },
  },
});

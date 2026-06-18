'use server';

import { auth } from '@/lib/auth';
import type { UserRole } from '@prisma/client';

export interface OrgUser {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  organizationId: string;
  organizationName: string | null;
}

/** Returns the authenticated session user. Throws if not logged in. */
export async function getAuthUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Non autorisé');
  return session.user;
}

/** Returns the org-scoped user. Throws if not logged in or has no org. */
export async function getOrgUser(): Promise<OrgUser> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Non autorisé');
  if (!session.user.organizationId) throw new Error('Non autorisé — Aucune organisation associée.');
  return {
    id: session.user.id,
    name: session.user.name ?? null,
    email: session.user.email ?? null,
    role: session.user.role,
    organizationId: session.user.organizationId,
    organizationName: session.user.organizationName,
  };
}

/** Returns just the orgId. Throws if not logged in or has no org. */
export async function getOrgId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error('Non autorisé — Aucune organisation associée.');
  return session.user.organizationId;
}

/** Like getOrgId() but also blocks EMPLOYEE role. Use for all write actions. */
export async function requireAdminOrgId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error('Non autorisé — Aucune organisation associée.');
  if (session.user.role === 'EMPLOYEE') throw new Error('Non autorisé — droits insuffisants.');
  return session.user.organizationId;
}

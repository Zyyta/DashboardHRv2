'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/session';
import type { ActionResult } from '@/types';
import type { UserRole } from '@prisma/client';

// ---------- ORG-level user management ----------

export interface OrgUser {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  createdAt: Date;
  isSelf: boolean;
}

export interface OrgAdminData {
  users: OrgUser[];
  orgName: string;
  employeeCount: number;
  subscription: { plan: string; status: string; maxEmployees: number } | null;
}

export async function getOrgAdminData(): Promise<OrgAdminData> {
  const user = await getAuthUser();
  if (user.role !== 'ORG_ADMIN' && user.role !== 'SUPER_ADMIN') {
    throw new Error('Non autorisé — rôle insuffisant.');
  }
  if (!user.organizationId) throw new Error('Aucune organisation.');

  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    include: {
      users: {
        orderBy: { createdAt: 'asc' },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      },
      subscription: {
        select: { plan: true, status: true, maxEmployees: true },
      },
      _count: { select: { employees: true } },
    },
  });

  if (!org) throw new Error('Organisation introuvable.');

  return {
    orgName: org.name,
    employeeCount: org._count.employees,
    subscription: org.subscription,
    users: org.users.map((u) => ({ ...u, isSelf: u.id === user.id })),
  };
}

export async function updateUserRole(userId: string, role: UserRole): Promise<ActionResult> {
  const user = await getAuthUser();
  if (user.role !== 'ORG_ADMIN' && user.role !== 'SUPER_ADMIN') {
    return { success: false, error: 'Non autorisé.' };
  }
  if (!user.organizationId) return { success: false, error: 'Non autorisé.' };
  if (userId === user.id)
    return { success: false, error: 'Vous ne pouvez pas modifier votre propre rôle.' };
  if (role === 'SUPER_ADMIN' && user.role !== 'SUPER_ADMIN') {
    return { success: false, error: 'Vous ne pouvez pas assigner le rôle SUPER_ADMIN.' };
  }

  const target = await prisma.user.findFirst({
    where: { id: userId, organizationId: user.organizationId },
  });
  if (!target) return { success: false, error: 'Utilisateur introuvable.' };

  try {
    await prisma.user.update({ where: { id: userId }, data: { role } });
    revalidatePath('/admin');
    return { success: true };
  } catch (e) {
    console.error('[updateUserRole]', e);
    return { success: false, error: 'Une erreur est survenue.' };
  }
}

export async function removeOrgUser(userId: string): Promise<ActionResult> {
  const user = await getAuthUser();
  if (user.role !== 'ORG_ADMIN' && user.role !== 'SUPER_ADMIN') {
    return { success: false, error: 'Non autorisé.' };
  }
  if (!user.organizationId) return { success: false, error: 'Non autorisé.' };
  if (userId === user.id)
    return { success: false, error: 'Vous ne pouvez pas supprimer votre propre compte.' };

  const target = await prisma.user.findFirst({
    where: { id: userId, organizationId: user.organizationId },
  });
  if (!target) return { success: false, error: 'Utilisateur introuvable.' };

  try {
    await prisma.user.delete({ where: { id: userId } });
    revalidatePath('/admin');
    return { success: true };
  } catch (e) {
    console.error('[removeOrgUser]', e);
    return { success: false, error: 'Une erreur est survenue.' };
  }
}

// ---------- SUPER_ADMIN: platform-level ----------

export interface PlatformOrg {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  userCount: number;
  employeeCount: number;
  plan: string;
  status: string;
}

export interface PlatformStats {
  totalOrgs: number;
  totalUsers: number;
  totalEmployees: number;
  orgs: PlatformOrg[];
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const user = await getAuthUser();
  if (user.role !== 'SUPER_ADMIN')
    throw new Error('Accès réservé aux super-administrateurs.');

  const [orgs, totalUsers, totalEmployees] = await Promise.all([
    prisma.organization.findMany({
      include: {
        subscription: { select: { plan: true, status: true } },
        _count: { select: { users: true, employees: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count(),
    prisma.employee.count(),
  ]);

  return {
    totalOrgs: orgs.length,
    totalUsers,
    totalEmployees,
    orgs: orgs.map((o) => ({
      id: o.id,
      name: o.name,
      slug: o.slug,
      createdAt: o.createdAt,
      userCount: o._count.users,
      employeeCount: o._count.employees,
      plan: o.subscription?.plan ?? '—',
      status: o.subscription?.status ?? '—',
    })),
  };
}

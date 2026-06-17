'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { UserRole } from '@prisma/client';

type ActionResult = { success: true } | { success: false; error: string };

async function getSession() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Non autorisé');
  return session;
}

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
  const session = await getSession();
  if (!session.user.organizationId) throw new Error('Aucune organisation.');

  const org = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
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
    users: org.users.map((u) => ({ ...u, isSelf: u.id === session.user.id })),
  };
}

export async function updateUserRole(userId: string, role: UserRole): Promise<ActionResult> {
  const session = await getSession();
  if (!session.user.organizationId) return { success: false, error: 'Non autorisé.' };
  if (userId === session.user.id)
    return { success: false, error: 'Vous ne pouvez pas modifier votre propre rôle.' };

  const target = await prisma.user.findFirst({
    where: { id: userId, organizationId: session.user.organizationId },
  });
  if (!target) return { success: false, error: 'Utilisateur introuvable.' };

  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath('/admin');
  return { success: true };
}

export async function removeOrgUser(userId: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session.user.organizationId) return { success: false, error: 'Non autorisé.' };
  if (userId === session.user.id)
    return { success: false, error: 'Vous ne pouvez pas supprimer votre propre compte.' };

  const target = await prisma.user.findFirst({
    where: { id: userId, organizationId: session.user.organizationId },
  });
  if (!target) return { success: false, error: 'Utilisateur introuvable.' };

  await prisma.user.delete({ where: { id: userId } });
  revalidatePath('/admin');
  return { success: true };
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
  const session = await getSession();
  if (session.user.role !== 'SUPER_ADMIN')
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

'use server';

import { revalidatePath } from 'next/cache';
import { compare, hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getOrgUser } from '@/lib/session';
import { UpdateUserProfileSchema, UpdateOrgProfileSchema, ChangePasswordSchema } from '@/lib/validators';
import type { ActionResult } from '@/types';

export interface OrgSettings {
  user: { id: string; name: string | null; email: string; twoFactorEnabled: boolean };
  org: { id: string; name: string; slug: string; domain: string | null };
  subscription: {
    plan: string;
    status: string;
    maxEmployees: number;
    stripeCurrentPeriodEnd: Date | null;
    employeeCount: number;
  } | null;
}

export async function getOrgSettings(): Promise<OrgSettings> {
  const orgUser = await getOrgUser();

  const dbUser = await prisma.user.findUnique({
    where: { id: orgUser.id },
    include: {
      organization: {
        include: {
          subscription: true,
          _count: { select: { employees: { where: { status: { not: 'TERMINATED' } } } } },
        },
      },
    },
  });

  if (!dbUser?.organization) throw new Error('Organisation introuvable');

  return {
    user: { id: dbUser.id, name: dbUser.name, email: dbUser.email!, twoFactorEnabled: dbUser.twoFactorEnabled },
    org: {
      id: dbUser.organization.id,
      name: dbUser.organization.name,
      slug: dbUser.organization.slug,
      domain: dbUser.organization.domain,
    },
    subscription: dbUser.organization.subscription
      ? {
          plan: dbUser.organization.subscription.plan,
          status: dbUser.organization.subscription.status,
          maxEmployees: dbUser.organization.subscription.maxEmployees,
          stripeCurrentPeriodEnd: dbUser.organization.subscription.stripeCurrentPeriodEnd,
          employeeCount: dbUser.organization._count.employees,
        }
      : null,
  };
}

export async function updateUserProfile(name: string): Promise<ActionResult> {
  const orgUser = await getOrgUser();

  const parsed = UpdateUserProfileSchema.safeParse({ name });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  await prisma.user.update({ where: { id: orgUser.id }, data: { name: parsed.data.name.trim() } });
  revalidatePath('/dashboard/settings');
  return { success: true };
}

export async function updateOrgProfile(input: {
  name: string;
  domain: string;
}): Promise<ActionResult> {
  const orgUser = await getOrgUser();
  if (orgUser.role !== 'ORG_ADMIN' && orgUser.role !== 'SUPER_ADMIN') {
    return { success: false, error: 'Non autorisé.' };
  }

  const parsed = UpdateOrgProfileSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  try {
    await prisma.organization.update({
      where: { id: orgUser.organizationId },
      data: { name: parsed.data.name.trim(), domain: parsed.data.domain?.trim() || null },
    });
    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return { success: false, error: 'Ce domaine est déjà utilisé par une autre organisation.' };
    }
    return { success: false, error: 'Une erreur est survenue.' };
  }
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<ActionResult> {
  const orgUser = await getOrgUser();

  const parsed = ChangePasswordSchema.safeParse({ currentPassword, newPassword });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const dbUser = await prisma.user.findUnique({
    where: { id: orgUser.id },
    select: { password: true },
  });

  if (!dbUser?.password)
    return { success: false, error: 'Ce compte ne possède pas de mot de passe (connexion OAuth).' };

  const valid = await compare(currentPassword, dbUser.password);
  if (!valid) return { success: false, error: 'Mot de passe actuel incorrect.' };

  await prisma.user.update({
    where: { id: orgUser.id },
    data: { password: await hash(newPassword, 12) },
  });
  return { success: true };
}

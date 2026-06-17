'use server';

import { revalidatePath } from 'next/cache';
import { compare, hash } from 'bcryptjs';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

type ActionResult = { success: true } | { success: false; error: string };

async function getAuthedUser() {
  const session = await auth();
  if (!session?.user?.id || !session.user.organizationId) throw new Error('Non autorisé');
  return session.user;
}

export interface OrgSettings {
  user: { id: string; name: string | null; email: string };
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
  const user = await getAuthedUser();

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
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
    user: { id: dbUser.id, name: dbUser.name, email: dbUser.email },
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
  const user = await getAuthedUser();
  const trimmed = name.trim();
  if (!trimmed) return { success: false, error: 'Le nom est obligatoire.' };

  await prisma.user.update({ where: { id: user.id }, data: { name: trimmed } });
  revalidatePath('/dashboard/settings');
  return { success: true };
}

export async function updateOrgProfile(input: {
  name: string;
  domain: string;
}): Promise<ActionResult> {
  const user = await getAuthedUser();
  const name = input.name.trim();
  if (!name) return { success: false, error: "Le nom de l'organisation est obligatoire." };

  try {
    await prisma.organization.update({
      where: { id: user.organizationId! },
      data: { name, domain: input.domain.trim() || null },
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
  const user = await getAuthedUser();

  if (newPassword.length < 8)
    return { success: false, error: 'Le mot de passe doit contenir au moins 8 caractères.' };

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { password: true },
  });

  if (!dbUser?.password)
    return { success: false, error: 'Ce compte ne possède pas de mot de passe (connexion OAuth).' };

  const valid = await compare(currentPassword, dbUser.password);
  if (!valid) return { success: false, error: 'Mot de passe actuel incorrect.' };

  await prisma.user.update({
    where: { id: user.id },
    data: { password: await hash(newPassword, 12) },
  });
  return { success: true };
}

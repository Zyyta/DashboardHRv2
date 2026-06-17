'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

async function getOrgId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.organizationId) {
    throw new Error('Non autorisé');
  }
  return session.user.organizationId;
}

export interface DepartmentWithStats {
  id: string;
  name: string;
  description: string | null;
  color: string;
  totalEmployees: number;
  activeEmployees: number;
  avgSalary: number;
  maleCount: number;
  femaleCount: number;
}

export async function getDepartments(): Promise<DepartmentWithStats[]> {
  const orgId = await getOrgId();

  const departments = await prisma.department.findMany({
    where: { organizationId: orgId },
    include: {
      employees: {
        select: { status: true, salary: true, gender: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  return departments.map((dept) => {
    const nonTerminated = dept.employees.filter((e) => e.status !== 'TERMINATED');
    const salaries = nonTerminated.map((e) => e.salary);
    const avgSalary =
      salaries.length > 0
        ? Math.round(salaries.reduce((s, v) => s + v, 0) / salaries.length)
        : 0;

    return {
      id: dept.id,
      name: dept.name,
      description: dept.description,
      color: dept.color ?? '#6366f1',
      totalEmployees: dept.employees.length,
      activeEmployees: dept.employees.filter((e) => e.status === 'ACTIVE').length,
      avgSalary,
      maleCount: nonTerminated.filter((e) => e.gender === 'MALE').length,
      femaleCount: nonTerminated.filter((e) => e.gender === 'FEMALE').length,
    };
  });
}

export type ActionResult =
  | { success: true }
  | { success: false; error: string };

export async function createDepartment(input: {
  name: string;
  description?: string;
  color: string;
}): Promise<ActionResult> {
  const orgId = await getOrgId();

  const name = input.name.trim();
  if (!name) return { success: false, error: 'Le nom est obligatoire.' };

  try {
    await prisma.department.create({
      data: {
        name,
        description: input.description?.trim() || null,
        color: input.color,
        organizationId: orgId,
      },
    });
    revalidatePath('/dashboard/departments');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return { success: false, error: 'Un département avec ce nom existe déjà.' };
    }
    console.error('[createDepartment]', e);
    return { success: false, error: 'Une erreur est survenue.' };
  }
}

export async function updateDepartment(
  id: string,
  input: { name: string; description?: string; color: string }
): Promise<ActionResult> {
  const orgId = await getOrgId();

  const name = input.name.trim();
  if (!name) return { success: false, error: 'Le nom est obligatoire.' };

  // Ensure the department belongs to the caller's organization
  const existing = await prisma.department.findFirst({
    where: { id, organizationId: orgId },
    select: { id: true },
  });
  if (!existing) return { success: false, error: 'Département introuvable.' };

  try {
    await prisma.department.update({
      where: { id },
      data: {
        name,
        description: input.description?.trim() || null,
        color: input.color,
      },
    });
    revalidatePath('/dashboard/departments');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return { success: false, error: 'Un département avec ce nom existe déjà.' };
    }
    console.error('[updateDepartment]', e);
    return { success: false, error: 'Une erreur est survenue.' };
  }
}

export async function deleteDepartment(id: string): Promise<ActionResult> {
  const orgId = await getOrgId();

  const dept = await prisma.department.findFirst({
    where: { id, organizationId: orgId },
    include: { _count: { select: { employees: true } } },
  });

  if (!dept) return { success: false, error: 'Département introuvable.' };

  if (dept._count.employees > 0) {
    return {
      success: false,
      error: `Impossible de supprimer : ${dept._count.employees} employé(s) y sont rattachés. Réaffectez-les d'abord.`,
    };
  }

  try {
    await prisma.department.delete({ where: { id } });
    revalidatePath('/dashboard/departments');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (e) {
    console.error('[deleteDepartment]', e);
    return { success: false, error: 'Une erreur est survenue.' };
  }
}

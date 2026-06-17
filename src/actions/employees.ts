'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { EmployeeStatus, Gender } from '@prisma/client';

async function getOrgId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.organizationId) {
    throw new Error('Non autorisé — Aucune organisation associée.');
  }
  return session.user.organizationId;
}

export interface ActionResult {
  success: boolean;
  error?: string;
}

export interface EmployeeRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  status: EmployeeStatus;
  hireDate: Date;
  dateOfBirth: Date;
  salary: number;
  gender: string;
  phone: string | null;
  address: string | null;
  department: { id: string; name: string; color: string | null };
  tenureYears: number;
}

export interface EmployeeListResult {
  employees: EmployeeRow[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getEmployees(params: {
  search?: string;
  status?: EmployeeStatus | 'ALL';
  departmentId?: string;
  page?: number;
  pageSize?: number;
}): Promise<EmployeeListResult> {
  const orgId = await getOrgId();

  const { search, status, departmentId, page = 1, pageSize = 20 } = params;
  const skip = (page - 1) * pageSize;

  const where = {
    organizationId: orgId,
    ...(status && status !== 'ALL' ? { status } : {}),
    ...(departmentId ? { departmentId } : {}),
    ...(search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { position: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [employees, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      include: { department: { select: { id: true, name: true, color: true } } },
      orderBy: { lastName: 'asc' },
      skip,
      take: pageSize,
    }),
    prisma.employee.count({ where }),
  ]);

  const now = Date.now();

  return {
    employees: employees.map((e) => ({
      id: e.id,
      firstName: e.firstName,
      lastName: e.lastName,
      email: e.email,
      position: e.position,
      status: e.status,
      hireDate: e.hireDate,
      dateOfBirth: e.dateOfBirth,
      salary: e.salary,
      gender: e.gender,
      phone: e.phone,
      address: e.address,
      department: e.department,
      tenureYears:
        Math.round(
          ((now - e.hireDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) * 10
        ) / 10,
    })),
    total,
    page,
    pageSize,
  };
}

export interface EmployeeDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  position: string;
  gender: string;
  dateOfBirth: Date;
  hireDate: Date;
  salary: number;
  status: EmployeeStatus;
  avatar: string | null;
  address: string | null;
  department: { id: string; name: string; color: string | null };
  tenureYears: number;
  leaveRecords: {
    id: string;
    type: string;
    status: string;
    startDate: Date;
    endDate: Date;
    days: number;
    reason: string | null;
  }[];
  terminationRecord: {
    terminationDate: Date;
    reason: string;
    notes: string | null;
  } | null;
}

export async function getEmployeeById(id: string): Promise<EmployeeDetail | null> {
  const orgId = await getOrgId();

  const employee = await prisma.employee.findFirst({
    where: { id, organizationId: orgId },
    include: {
      department: { select: { id: true, name: true, color: true } },
      leaveRecords: { orderBy: { startDate: 'desc' } },
      terminationRecord: true,
    },
  });

  if (!employee) return null;

  const tenureYears =
    Math.round(
      ((Date.now() - employee.hireDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) * 10
    ) / 10;

  return {
    id: employee.id,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    phone: employee.phone,
    position: employee.position,
    gender: employee.gender,
    dateOfBirth: employee.dateOfBirth,
    hireDate: employee.hireDate,
    salary: employee.salary,
    status: employee.status,
    avatar: employee.avatar,
    address: employee.address,
    department: employee.department,
    tenureYears,
    leaveRecords: employee.leaveRecords.map((lr) => ({
      id: lr.id,
      type: lr.type,
      status: lr.status,
      startDate: lr.startDate,
      endDate: lr.endDate,
      days: lr.days,
      reason: lr.reason,
    })),
    terminationRecord: employee.terminationRecord
      ? {
          terminationDate: employee.terminationRecord.terminationDate,
          reason: employee.terminationRecord.reason,
          notes: employee.terminationRecord.notes,
        }
      : null,
  };
}

export async function getDepartmentsForFilter(): Promise<
  { id: string; name: string; color: string | null }[]
> {
  const orgId = await getOrgId();

  return prisma.department.findMany({
    where: { organizationId: orgId },
    select: { id: true, name: true, color: true },
    orderBy: { name: 'asc' },
  });
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

export async function createEmployee(data: {
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  gender: string;
  dateOfBirth: string;
  hireDate: string;
  salary: string;
  departmentId: string;
  phone?: string;
  address?: string;
}): Promise<ActionResult> {
  const orgId = await getOrgId();

  if (!data.firstName || !data.lastName || !data.email || !data.position ||
      !data.gender || !data.dateOfBirth || !data.hireDate || !data.salary || !data.departmentId) {
    return { success: false, error: 'Tous les champs obligatoires doivent être remplis.' };
  }

  // Quota enforcement
  const [sub, activeCount] = await Promise.all([
    prisma.subscription.findUnique({ where: { organizationId: orgId }, select: { maxEmployees: true } }),
    prisma.employee.count({ where: { organizationId: orgId, status: { not: 'TERMINATED' } } }),
  ]);
  if (sub && activeCount >= sub.maxEmployees) {
    return {
      success: false,
      error: `Quota atteint : ${activeCount}/${sub.maxEmployees} employés. Passez à un plan supérieur dans Facturation.`,
    };
  }

  const salaryNum = parseFloat(data.salary);
  if (isNaN(salaryNum) || salaryNum < 0) {
    return { success: false, error: 'Le salaire doit être un nombre positif.' };
  }

  const existing = await prisma.employee.findFirst({
    where: { email: data.email.trim().toLowerCase(), organizationId: orgId },
  });
  if (existing) {
    return { success: false, error: 'Un employé avec cet email existe déjà.' };
  }

  const dept = await prisma.department.findFirst({
    where: { id: data.departmentId, organizationId: orgId },
  });
  if (!dept) {
    return { success: false, error: 'Département introuvable.' };
  }

  try {
    await prisma.employee.create({
      data: {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim().toLowerCase(),
        position: data.position.trim(),
        gender: data.gender as Gender,
        dateOfBirth: new Date(data.dateOfBirth),
        hireDate: new Date(data.hireDate),
        salary: salaryNum,
        departmentId: data.departmentId,
        phone: data.phone?.trim() || null,
        address: data.address?.trim() || null,
        organizationId: orgId,
        status: 'ACTIVE',
      },
    });

    revalidatePath('/dashboard/employees');
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la création de l'employé." };
  }
}

export async function updateEmployee(
  id: string,
  data: {
    firstName: string;
    lastName: string;
    email: string;
    position: string;
    gender: string;
    dateOfBirth: string;
    hireDate: string;
    salary: string;
    departmentId: string;
    status: string;
    phone?: string;
    address?: string;
  }
): Promise<ActionResult> {
  const orgId = await getOrgId();

  const employee = await prisma.employee.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!employee) {
    return { success: false, error: 'Employé introuvable.' };
  }

  const salaryNum = parseFloat(data.salary);
  if (isNaN(salaryNum) || salaryNum < 0) {
    return { success: false, error: 'Le salaire doit être un nombre positif.' };
  }

  // Email uniqueness check (excluding self)
  const emailConflict = await prisma.employee.findFirst({
    where: {
      email: data.email.trim().toLowerCase(),
      organizationId: orgId,
      NOT: { id },
    },
  });
  if (emailConflict) {
    return { success: false, error: 'Un autre employé utilise déjà cet email.' };
  }

  try {
    await prisma.employee.update({
      where: { id },
      data: {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim().toLowerCase(),
        position: data.position.trim(),
        gender: data.gender as Gender,
        dateOfBirth: new Date(data.dateOfBirth),
        hireDate: new Date(data.hireDate),
        salary: salaryNum,
        departmentId: data.departmentId,
        status: data.status as EmployeeStatus,
        phone: data.phone?.trim() || null,
        address: data.address?.trim() || null,
      },
    });

    revalidatePath('/dashboard/employees');
    revalidatePath(`/dashboard/employees/${id}`);
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la mise à jour de l'employé." };
  }
}

export async function updateEmployeeStatus(
  id: string,
  status: EmployeeStatus
): Promise<ActionResult> {
  const orgId = await getOrgId();

  const employee = await prisma.employee.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!employee) {
    return { success: false, error: 'Employé introuvable.' };
  }

  try {
    await prisma.employee.update({
      where: { id },
      data: { status },
    });

    revalidatePath('/dashboard/employees');
    revalidatePath(`/dashboard/employees/${id}`);
    return { success: true };
  } catch {
    return { success: false, error: 'Erreur lors de la mise à jour du statut.' };
  }
}

export async function deleteEmployee(id: string): Promise<ActionResult> {
  const orgId = await getOrgId();

  const employee = await prisma.employee.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!employee) {
    return { success: false, error: 'Employé introuvable.' };
  }

  try {
    await prisma.$transaction([
      prisma.terminationRecord.deleteMany({ where: { employeeId: id } }),
      prisma.leaveRecord.deleteMany({ where: { employeeId: id } }),
      prisma.employee.delete({ where: { id } }),
    ]);

    revalidatePath('/dashboard/employees');
    return { success: true };
  } catch {
    return { success: false, error: 'Erreur lors de la suppression.' };
  }
}

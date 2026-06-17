'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { EmployeeStatus } from '@prisma/client';

async function getOrgId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.organizationId) {
    throw new Error('Non autorisé — Aucune organisation associée.');
  }
  return session.user.organizationId;
}

export interface EmployeeRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  status: EmployeeStatus;
  hireDate: Date;
  salary: number;
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
      salary: e.salary,
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

'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export interface SearchResult {
  employees: { id: string; name: string; position: string; department: string }[];
  departments: { id: string; name: string; employeeCount: number }[];
}

export async function searchGlobal(query: string): Promise<SearchResult> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return { employees: [], departments: [] };

  const session = await auth();
  if (!session?.user?.organizationId) return { employees: [], departments: [] };
  const orgId = session.user.organizationId;

  const [employees, departments] = await Promise.all([
    prisma.employee.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { firstName: { contains: trimmed, mode: 'insensitive' } },
          { lastName: { contains: trimmed, mode: 'insensitive' } },
          { email: { contains: trimmed, mode: 'insensitive' } },
          { position: { contains: trimmed, mode: 'insensitive' } },
        ],
      },
      include: { department: { select: { name: true } } },
      take: 8,
      orderBy: { lastName: 'asc' },
    }),
    prisma.department.findMany({
      where: {
        organizationId: orgId,
        name: { contains: trimmed, mode: 'insensitive' },
      },
      include: { _count: { select: { employees: true } } },
      take: 4,
    }),
  ]);

  return {
    employees: employees.map((e) => ({
      id: e.id,
      name: `${e.firstName} ${e.lastName}`,
      position: e.position,
      department: e.department.name,
    })),
    departments: departments.map((d) => ({
      id: d.id,
      name: d.name,
      employeeCount: d._count.employees,
    })),
  };
}

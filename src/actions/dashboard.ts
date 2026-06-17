// =============================================================================
// Server Actions — Dashboard KPIs & Analytics
// All queries are scoped to the authenticated user's organization
// =============================================================================

'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type {
  DashboardStats,
  DepartmentDistribution,
  MonthlyHeadcount,
  MonthlyTurnover,
  AgePyramidData,
  GenderDistribution,
  MonthlyAbsence,
  SalaryEquity,
} from '@/types';

// ---------------------------------------------------------------------------
// Helper: Get authenticated organization ID
// ---------------------------------------------------------------------------

async function getOrgId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.organizationId) {
    throw new Error('Non autorisé — Aucune organisation associée.');
  }
  return session.user.organizationId;
}

// ---------------------------------------------------------------------------
// Main: Get all dashboard statistics
// ---------------------------------------------------------------------------

export async function getDashboardStats(): Promise<DashboardStats> {
  const organizationId = await getOrgId();

  const [
    totalEmployees,
    activeEmployees,
    newHires,
    departmentDistribution,
    monthlyHeadcount,
    monthlyTurnover,
    agePyramid,
    genderDistribution,
    monthlyAbsence,
    salaryEquity,
    turnoverRate,
    absenteeismRate,
    averageTenure,
  ] = await Promise.all([
    getTotalEmployees(organizationId),
    getActiveEmployees(organizationId),
    getNewHires(organizationId),
    getDepartmentDistribution(organizationId),
    getMonthlyHeadcount(organizationId),
    getMonthlyTurnover(organizationId),
    getAgePyramid(organizationId),
    getGenderDistribution(organizationId),
    getMonthlyAbsence(organizationId),
    getSalaryEquity(organizationId),
    getTurnoverRate(organizationId),
    getAbsenteeismRate(organizationId),
    getAverageTenure(organizationId),
  ]);

  return {
    totalEmployees,
    activeEmployees,
    newHires,
    turnoverRate,
    absenteeismRate,
    averageTenure,
    departmentDistribution,
    monthlyHeadcount,
    monthlyTurnover,
    agePyramid,
    genderDistribution,
    monthlyAbsence,
    salaryEquity,
  };
}

// ---------------------------------------------------------------------------
// Individual metric queries
// ---------------------------------------------------------------------------

async function getTotalEmployees(orgId: string): Promise<number> {
  return prisma.employee.count({
    where: { organizationId: orgId },
  });
}

async function getActiveEmployees(orgId: string): Promise<number> {
  return prisma.employee.count({
    where: { organizationId: orgId, status: 'ACTIVE' },
  });
}

async function getNewHires(orgId: string): Promise<number> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return prisma.employee.count({
    where: {
      organizationId: orgId,
      hireDate: { gte: thirtyDaysAgo },
    },
  });
}

async function getTurnoverRate(orgId: string): Promise<number> {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const [terminated, total] = await Promise.all([
    prisma.terminationRecord.count({
      where: {
        employee: { organizationId: orgId },
        terminationDate: { gte: oneYearAgo },
      },
    }),
    prisma.employee.count({ where: { organizationId: orgId } }),
  ]);

  return total > 0 ? Math.round((terminated / total) * 100 * 10) / 10 : 0;
}

async function getAbsenteeismRate(orgId: string): Promise<number> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [leaveRecords, activeCount] = await Promise.all([
    prisma.leaveRecord.aggregate({
      _sum: { days: true },
      where: {
        employee: { organizationId: orgId, status: 'ACTIVE' },
        status: 'APPROVED',
        startDate: { gte: thirtyDaysAgo },
      },
    }),
    prisma.employee.count({
      where: { organizationId: orgId, status: 'ACTIVE' },
    }),
  ]);

  const totalLeaveDays = leaveRecords._sum.days || 0;
  const totalWorkDays = activeCount * 22; // ~22 working days per month
  return totalWorkDays > 0
    ? Math.round((totalLeaveDays / totalWorkDays) * 100 * 10) / 10
    : 0;
}

async function getAverageTenure(orgId: string): Promise<number> {
  const employees = await prisma.employee.findMany({
    where: { organizationId: orgId, status: 'ACTIVE' },
    select: { hireDate: true },
  });

  if (employees.length === 0) return 0;

  const now = Date.now();
  const totalYears = employees.reduce((sum, emp) => {
    return sum + (now - emp.hireDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  }, 0);

  return Math.round((totalYears / employees.length) * 10) / 10;
}

async function getDepartmentDistribution(orgId: string): Promise<DepartmentDistribution[]> {
  const departments = await prisma.department.findMany({
    where: { organizationId: orgId },
    include: {
      _count: {
        select: { employees: { where: { status: { not: 'TERMINATED' } } } },
      },
    },
  });

  return departments.map((dept) => ({
    name: dept.name,
    value: dept._count.employees,
    color: dept.color || '#6366f1',
  }));
}

async function getMonthlyHeadcount(orgId: string): Promise<MonthlyHeadcount[]> {
  const months = [
    'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
    'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc',
  ];

  const now = new Date();
  const result: MonthlyHeadcount[] = [];

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);

    const [hires, departures] = await Promise.all([
      prisma.employee.count({
        where: {
          organizationId: orgId,
          hireDate: { gte: date, lt: nextMonth },
        },
      }),
      prisma.terminationRecord.count({
        where: {
          employee: { organizationId: orgId },
          terminationDate: { gte: date, lt: nextMonth },
        },
      }),
    ]);

    result.push({
      month: months[date.getMonth()],
      embauches: hires,
      departs: departures,
    });
  }

  return result;
}

async function getMonthlyTurnover(orgId: string): Promise<MonthlyTurnover[]> {
  const months = [
    'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
    'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc',
  ];

  const now = new Date();
  const result: MonthlyTurnover[] = [];
  let runningSum = 0;

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);

    const [departed, total] = await Promise.all([
      prisma.terminationRecord.count({
        where: {
          employee: { organizationId: orgId },
          terminationDate: { gte: date, lt: nextMonth },
        },
      }),
      prisma.employee.count({
        where: {
          organizationId: orgId,
          hireDate: { lt: nextMonth },
        },
      }),
    ]);

    const rate = total > 0 ? Math.round((departed / total) * 100 * 10) / 10 : 0;
    runningSum += rate;
    const idx = 12 - i;

    result.push({
      month: months[date.getMonth()],
      taux: rate,
      moyenne: Math.round((runningSum / idx) * 10) / 10,
    });
  }

  return result;
}

async function getAgePyramid(orgId: string): Promise<AgePyramidData[]> {
  const employees = await prisma.employee.findMany({
    where: { organizationId: orgId, status: { not: 'TERMINATED' } },
    select: { dateOfBirth: true, gender: true },
  });

  const ranges = [
    { label: '18-25', min: 18, max: 25 },
    { label: '26-30', min: 26, max: 30 },
    { label: '31-35', min: 31, max: 35 },
    { label: '36-40', min: 36, max: 40 },
    { label: '41-45', min: 41, max: 45 },
    { label: '46-50', min: 46, max: 50 },
    { label: '51-55', min: 51, max: 55 },
    { label: '55+', min: 56, max: 100 },
  ];

  const now = new Date();

  return ranges.map((range) => {
    let hommes = 0;
    let femmes = 0;

    employees.forEach((emp) => {
      const age = Math.floor(
        (now.getTime() - emp.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      );

      if (age >= range.min && age <= range.max) {
        if (emp.gender === 'MALE') hommes++;
        else femmes++;
      }
    });

    return {
      tranche: range.label,
      hommes,
      femmes: -femmes, // Negative for pyramid effect
    };
  });
}

async function getGenderDistribution(orgId: string): Promise<GenderDistribution[]> {
  const [male, female] = await Promise.all([
    prisma.employee.count({
      where: { organizationId: orgId, status: { not: 'TERMINATED' }, gender: 'MALE' },
    }),
    prisma.employee.count({
      where: { organizationId: orgId, status: { not: 'TERMINATED' }, gender: 'FEMALE' },
    }),
  ]);

  return [
    { name: 'Hommes', value: male, color: '#3b82f6' },
    { name: 'Femmes', value: female, color: '#ec4899' },
  ];
}

async function getMonthlyAbsence(orgId: string): Promise<MonthlyAbsence[]> {
  const months = [
    'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
    'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc',
  ];

  const now = new Date();
  const result: MonthlyAbsence[] = [];

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);

    const [leaveDays, activeCount] = await Promise.all([
      prisma.leaveRecord.aggregate({
        _sum: { days: true },
        where: {
          employee: { organizationId: orgId, status: 'ACTIVE' },
          status: 'APPROVED',
          startDate: { gte: date, lt: nextMonth },
        },
      }),
      prisma.employee.count({
        where: { organizationId: orgId, status: 'ACTIVE' },
      }),
    ]);

    const totalWorkDays = activeCount * 22;
    const rate = totalWorkDays > 0
      ? Math.round(((leaveDays._sum.days || 0) / totalWorkDays) * 100 * 10) / 10
      : 0;

    result.push({
      month: months[date.getMonth()],
      taux: rate,
    });
  }

  return result;
}

async function getSalaryEquity(orgId: string): Promise<SalaryEquity[]> {
  const departments = await prisma.department.findMany({
    where: { organizationId: orgId },
    include: {
      employees: {
        where: { status: { not: 'TERMINATED' } },
        select: { gender: true, salary: true },
      },
    },
  });

  return departments.map((dept) => {
    const males = dept.employees.filter((e) => e.gender === 'MALE');
    const females = dept.employees.filter((e) => e.gender === 'FEMALE');

    const avgMale = males.length > 0
      ? Math.round(males.reduce((s, e) => s + e.salary, 0) / males.length)
      : 0;
    const avgFemale = females.length > 0
      ? Math.round(females.reduce((s, e) => s + e.salary, 0) / females.length)
      : 0;

    return {
      dept: dept.name,
      hommes: avgMale,
      femmes: avgFemale,
    };
  });
}

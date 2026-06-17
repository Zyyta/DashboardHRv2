'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function getOrgId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.organizationId) {
    throw new Error('Non autorisé');
  }
  return session.user.organizationId;
}

// ---------------------------------------------------------------------------
// Rapport Effectifs — Full headcount analysis per department
// ---------------------------------------------------------------------------

export interface DepartmentReport {
  id: string;
  name: string;
  color: string | null;
  total: number;
  active: number;
  onLeave: number;
  terminated: number;
  turnoverRate: number;
  avgSalary: number;
  minSalary: number;
  maxSalary: number;
  avgTenureYears: number;
  maleCount: number;
  femaleCount: number;
  genderRatioPct: number; // % female
  avgAge: number;
}

export async function getDepartmentReport(): Promise<DepartmentReport[]> {
  const orgId = await getOrgId();

  const departments = await prisma.department.findMany({
    where: { organizationId: orgId },
    include: {
      employees: {
        select: {
          status: true,
          salary: true,
          hireDate: true,
          gender: true,
          dateOfBirth: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  const now = Date.now();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const terminatedCounts = await prisma.terminationRecord.groupBy({
    by: ['employeeId'],
    where: {
      employee: { organizationId: orgId },
      terminationDate: { gte: oneYearAgo },
    },
  });
  const terminatedIds = new Set(terminatedCounts.map((t) => t.employeeId));

  return departments.map((dept) => {
    const all = dept.employees;
    const active = all.filter((e) => e.status === 'ACTIVE');
    const onLeave = all.filter((e) => e.status === 'ON_LEAVE');
    const terminated = all.filter((e) => e.status === 'TERMINATED');

    const salaries = all
      .filter((e) => e.status !== 'TERMINATED')
      .map((e) => e.salary);

    const avgSalary =
      salaries.length > 0
        ? Math.round(salaries.reduce((s, v) => s + v, 0) / salaries.length)
        : 0;

    const tenures = active.map(
      (e) => (now - e.hireDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    );
    const avgTenure =
      tenures.length > 0
        ? Math.round((tenures.reduce((s, v) => s + v, 0) / tenures.length) * 10) / 10
        : 0;

    const males = all.filter((e) => e.gender === 'MALE' && e.status !== 'TERMINATED');
    const females = all.filter((e) => e.gender === 'FEMALE' && e.status !== 'TERMINATED');
    const nonTerminated = males.length + females.length;

    const ages = all
      .filter((e) => e.status !== 'TERMINATED')
      .map((e) =>
        Math.floor((now - e.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      );
    const avgAge =
      ages.length > 0 ? Math.round(ages.reduce((s, v) => s + v, 0) / ages.length) : 0;

    const deptTerminatedLastYear = terminated.filter((e) =>
      terminatedIds.has((e as { id?: string }).id ?? '')
    ).length;
    const turnoverRate =
      all.length > 0
        ? Math.round((deptTerminatedLastYear / all.length) * 100 * 10) / 10
        : 0;

    return {
      id: dept.id,
      name: dept.name,
      color: dept.color,
      total: all.length,
      active: active.length,
      onLeave: onLeave.length,
      terminated: terminated.length,
      turnoverRate,
      avgSalary,
      minSalary: salaries.length > 0 ? Math.min(...salaries) : 0,
      maxSalary: salaries.length > 0 ? Math.max(...salaries) : 0,
      avgTenureYears: avgTenure,
      maleCount: males.length,
      femaleCount: females.length,
      genderRatioPct:
        nonTerminated > 0 ? Math.round((females.length / nonTerminated) * 100) : 0,
      avgAge,
    };
  });
}

// ---------------------------------------------------------------------------
// Rapport Absences — Monthly absence analysis with detail
// ---------------------------------------------------------------------------

export interface MonthlyAbsenceReport {
  month: string;
  monthLabel: string;
  totalDays: number;
  employeesAffected: number;
  sickDays: number;
  vacationDays: number;
  maternityDays: number;
  paternityDays: number;
  unpaidDays: number;
  otherDays: number;
  absenceRate: number;
  records: number;
}

export async function getAbsenceReport(): Promise<MonthlyAbsenceReport[]> {
  const orgId = await getOrgId();
  const monthLabels = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
  ];

  const now = new Date();
  const result: MonthlyAbsenceReport[] = [];

  const [activeCount] = await Promise.all([
    prisma.employee.count({ where: { organizationId: orgId, status: 'ACTIVE' } }),
  ]);

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    const records = await prisma.leaveRecord.findMany({
      where: {
        employee: { organizationId: orgId },
        status: 'APPROVED',
        startDate: { gte: date, lt: nextMonth },
      },
      select: { type: true, days: true, employeeId: true },
    });

    const byType = (type: string) =>
      records.filter((r) => r.type === type).reduce((s, r) => s + r.days, 0);

    const totalDays = records.reduce((s, r) => s + r.days, 0);
    const uniqueEmployees = new Set(records.map((r) => r.employeeId)).size;
    const totalWorkDays = activeCount * 22;

    result.push({
      month: monthKey,
      monthLabel: monthLabels[date.getMonth()],
      totalDays,
      employeesAffected: uniqueEmployees,
      sickDays: byType('SICK'),
      vacationDays: byType('VACATION'),
      maternityDays: byType('MATERNITY'),
      paternityDays: byType('PATERNITY'),
      unpaidDays: byType('UNPAID'),
      otherDays: byType('OTHER'),
      absenceRate:
        totalWorkDays > 0
          ? Math.round((totalDays / totalWorkDays) * 100 * 10) / 10
          : 0,
      records: records.length,
    });
  }

  return result;
}

// ---------------------------------------------------------------------------
// Rapport Turnover — Departures by department and reason
// ---------------------------------------------------------------------------

export interface TurnoverReport {
  departmentName: string;
  departmentColor: string | null;
  totalDepartures: number;
  resignations: number;
  layoffs: number;
  mutual: number;
  endOfContract: number;
  retirement: number;
  other: number;
  turnoverRate: number;
  avgTenureAtDeparture: number;
  totalHeadcount: number;
}

export async function getTurnoverReport(): Promise<TurnoverReport[]> {
  const orgId = await getOrgId();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const terminations = await prisma.terminationRecord.findMany({
    where: {
      employee: { organizationId: orgId },
      terminationDate: { gte: oneYearAgo },
    },
    include: {
      employee: {
        select: {
          hireDate: true,
          department: { select: { id: true, name: true, color: true } },
        },
      },
    },
  });

  const deptMap = new Map<
    string,
    {
      name: string;
      color: string | null;
      records: typeof terminations;
      headcount: number;
    }
  >();

  // Seed departments from all employees
  const allDepts = await prisma.department.findMany({
    where: { organizationId: orgId },
    include: { _count: { select: { employees: true } } },
  });
  for (const d of allDepts) {
    deptMap.set(d.id, {
      name: d.name,
      color: d.color,
      records: [],
      headcount: d._count.employees,
    });
  }

  for (const t of terminations) {
    const deptId = t.employee.department.id;
    if (deptMap.has(deptId)) {
      deptMap.get(deptId)!.records.push(t);
    }
  }

  return Array.from(deptMap.entries()).map(([, dept]) => {
    const byReason = (r: string) =>
      dept.records.filter((t) => t.reason === r).length;

    const avgTenure =
      dept.records.length > 0
        ? Math.round(
            (dept.records.reduce((s, t) => {
              const months =
                (t.terminationDate.getTime() - t.employee.hireDate.getTime()) /
                (365.25 / 12 * 24 * 60 * 60 * 1000);
              return s + months;
            }, 0) /
              dept.records.length) *
              10
          ) / 10
        : 0;

    return {
      departmentName: dept.name,
      departmentColor: dept.color,
      totalDepartures: dept.records.length,
      resignations: byReason('RESIGNATION'),
      layoffs: byReason('LAYOFF'),
      mutual: byReason('MUTUAL'),
      endOfContract: byReason('END_OF_CONTRACT'),
      retirement: byReason('RETIREMENT'),
      other: byReason('OTHER'),
      turnoverRate:
        dept.headcount > 0
          ? Math.round((dept.records.length / dept.headcount) * 100 * 10) / 10
          : 0,
      avgTenureAtDeparture: avgTenure,
      totalHeadcount: dept.headcount,
    };
  });
}

// ---------------------------------------------------------------------------
// Rapport Parité Salariale — Salary equity full breakdown
// ---------------------------------------------------------------------------

export interface SalaryEquityReport {
  departmentName: string;
  departmentColor: string | null;
  maleCount: number;
  femaleCount: number;
  maleAvg: number;
  femaleAvg: number;
  maleMin: number;
  maleMax: number;
  femaleMin: number;
  femaleMax: number;
  gapPct: number;
  gapAmount: number;
  gapFavorable: 'men' | 'women' | 'equal';
}

export async function getSalaryEquityReport(): Promise<SalaryEquityReport[]> {
  const orgId = await getOrgId();

  const departments = await prisma.department.findMany({
    where: { organizationId: orgId },
    include: {
      employees: {
        where: { status: { not: 'TERMINATED' } },
        select: { gender: true, salary: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  return departments.map((dept) => {
    const males = dept.employees.filter((e) => e.gender === 'MALE').map((e) => e.salary);
    const females = dept.employees.filter((e) => e.gender === 'FEMALE').map((e) => e.salary);

    const avg = (arr: number[]) =>
      arr.length > 0 ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : 0;

    const maleAvg = avg(males);
    const femaleAvg = avg(females);
    const gapAmount = maleAvg - femaleAvg;
    const gapPct =
      maleAvg > 0 ? Math.round((Math.abs(gapAmount) / maleAvg) * 100 * 10) / 10 : 0;

    return {
      departmentName: dept.name,
      departmentColor: dept.color,
      maleCount: males.length,
      femaleCount: females.length,
      maleAvg,
      femaleAvg,
      maleMin: males.length > 0 ? Math.min(...males) : 0,
      maleMax: males.length > 0 ? Math.max(...males) : 0,
      femaleMin: females.length > 0 ? Math.min(...females) : 0,
      femaleMax: females.length > 0 ? Math.max(...females) : 0,
      gapPct,
      gapAmount: Math.abs(gapAmount),
      gapFavorable: gapAmount > 0 ? 'men' : gapAmount < 0 ? 'women' : 'equal',
    };
  });
}

// ---------------------------------------------------------------------------
// Rapport Organisation — Global summary stats
// ---------------------------------------------------------------------------

export interface OrgSummary {
  totalEmployees: number;
  activeEmployees: number;
  onLeaveEmployees: number;
  terminatedEmployees: number;
  newHiresLast30: number;
  newHiresLast90: number;
  terminationsLast12m: number;
  turnoverRate12m: number;
  avgSalary: number;
  totalPayroll: number;
  avgTenureYears: number;
  avgAge: number;
  maleCount: number;
  femaleCount: number;
  departmentCount: number;
  absenteeismRateLast30: number;
}

export async function getOrgSummary(): Promise<OrgSummary> {
  const orgId = await getOrgId();
  const now = new Date();
  const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(now.getDate() - 30);
  const ninetyDaysAgo = new Date(now); ninetyDaysAgo.setDate(now.getDate() - 90);
  const oneYearAgo = new Date(now); oneYearAgo.setFullYear(now.getFullYear() - 1);

  const [
    total, active, onLeave, terminated,
    newHires30, newHires90, terminations12m,
    employees, deptCount,
    leaveDays,
  ] = await Promise.all([
    prisma.employee.count({ where: { organizationId: orgId } }),
    prisma.employee.count({ where: { organizationId: orgId, status: 'ACTIVE' } }),
    prisma.employee.count({ where: { organizationId: orgId, status: 'ON_LEAVE' } }),
    prisma.employee.count({ where: { organizationId: orgId, status: 'TERMINATED' } }),
    prisma.employee.count({ where: { organizationId: orgId, hireDate: { gte: thirtyDaysAgo } } }),
    prisma.employee.count({ where: { organizationId: orgId, hireDate: { gte: ninetyDaysAgo } } }),
    prisma.terminationRecord.count({ where: { employee: { organizationId: orgId }, terminationDate: { gte: oneYearAgo } } }),
    prisma.employee.findMany({
      where: { organizationId: orgId, status: { not: 'TERMINATED' } },
      select: { salary: true, hireDate: true, dateOfBirth: true, gender: true },
    }),
    prisma.department.count({ where: { organizationId: orgId } }),
    prisma.leaveRecord.aggregate({
      _sum: { days: true },
      where: {
        employee: { organizationId: orgId, status: 'ACTIVE' },
        status: 'APPROVED',
        startDate: { gte: thirtyDaysAgo },
      },
    }),
  ]);

  const salaries = employees.map((e) => e.salary);
  const avgSalary = salaries.length > 0 ? Math.round(salaries.reduce((s, v) => s + v, 0) / salaries.length) : 0;
  const totalPayroll = Math.round(salaries.reduce((s, v) => s + v, 0));

  const nowMs = Date.now();
  const tenures = employees.map((e) => (nowMs - e.hireDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  const avgTenure = tenures.length > 0 ? Math.round((tenures.reduce((s, v) => s + v, 0) / tenures.length) * 10) / 10 : 0;

  const ages = employees.map((e) => Math.floor((nowMs - e.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000)));
  const avgAge = ages.length > 0 ? Math.round(ages.reduce((s, v) => s + v, 0) / ages.length) : 0;

  const males = employees.filter((e) => e.gender === 'MALE').length;
  const females = employees.filter((e) => e.gender === 'FEMALE').length;

  const totalWorkDays = active * 22;
  const absenceRate = totalWorkDays > 0
    ? Math.round(((leaveDays._sum.days ?? 0) / totalWorkDays) * 100 * 10) / 10
    : 0;

  return {
    totalEmployees: total,
    activeEmployees: active,
    onLeaveEmployees: onLeave,
    terminatedEmployees: terminated,
    newHiresLast30: newHires30,
    newHiresLast90: newHires90,
    terminationsLast12m: terminations12m,
    turnoverRate12m: total > 0 ? Math.round((terminations12m / total) * 100 * 10) / 10 : 0,
    avgSalary,
    totalPayroll,
    avgTenureYears: avgTenure,
    avgAge,
    maleCount: males,
    femaleCount: females,
    departmentCount: deptCount,
    absenteeismRateLast30: absenceRate,
  };
}

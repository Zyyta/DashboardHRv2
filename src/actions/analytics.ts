'use server';

import { prisma } from '@/lib/prisma';
import { getOrgId } from '@/lib/session';

export interface AttritionRiskEmployee {
  id: string;
  name: string;
  position: string;
  department: string;
  departmentColor: string;
  tenureMonths: number;
  score: number;
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  factors: { tenure: number; absence: number; salary: number; dept: number };
}

export interface DeptRiskSummary {
  name: string;
  color: string;
  avgScore: number;
  highRiskCount: number;
  mediumRiskCount: number;
  totalCount: number;
}

export interface AttritionRiskData {
  employees: AttritionRiskEmployee[];
  deptSummaries: DeptRiskSummary[];
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  avgScore: number;
  totalAnalyzed: number;
}

function getTenureRisk(hireDate: Date): number {
  const months = (Date.now() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  if (months < 6) return 8;
  if (months < 18) return 18;
  if (months < 24) return 40; // peak churn window
  if (months < 48) return 25;
  if (months < 84) return 12;
  return 5;
}

function getAbsenceRisk(sickDays: number): number {
  if (sickDays === 0) return 0;
  if (sickDays <= 3) return 5;
  if (sickDays <= 8) return 15;
  if (sickDays <= 15) return 25;
  return 30;
}

function getSalaryRisk(salary: number, deptMedian: number): number {
  if (deptMedian === 0) return 5;
  const ratio = salary / deptMedian;
  if (ratio > 1.1) return 0;
  if (ratio >= 0.9) return 5;
  if (ratio >= 0.75) return 12;
  return 20;
}

function getDeptTerminationRisk(terminatedCount: number, totalCount: number): number {
  if (totalCount === 0) return 0;
  const rate = terminatedCount / totalCount;
  if (rate < 0.05) return 0;
  if (rate < 0.1) return 3;
  if (rate < 0.2) return 6;
  return 10;
}

function getRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (score <= 30) return 'LOW';
  if (score <= 55) return 'MEDIUM';
  return 'HIGH';
}

export async function getAttritionRiskData(): Promise<AttritionRiskData> {
  const orgId = await getOrgId();

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

  const [employees, deptTerminations, deptTotals] = await Promise.all([
    prisma.employee.findMany({
      where: { organizationId: orgId, status: 'ACTIVE' },
      include: {
        department: { select: { name: true, color: true } },
        leaveRecords: {
          where: { type: 'SICK', startDate: { gte: twelveMonthsAgo } },
          select: { days: true },
        },
      },
    }),
    prisma.employee.groupBy({
      by: ['departmentId'],
      where: { organizationId: orgId, status: 'TERMINATED' },
      _count: { id: true },
    }),
    prisma.employee.groupBy({
      by: ['departmentId'],
      where: { organizationId: orgId },
      _count: { id: true },
    }),
  ]);

  const terminationMap = new Map(deptTerminations.map((r) => [r.departmentId, r._count.id]));
  const totalMap = new Map(deptTotals.map((r) => [r.departmentId, r._count.id]));

  // Department salary medians (active employees only)
  const deptSalaries = new Map<string, number[]>();
  for (const emp of employees) {
    const arr = deptSalaries.get(emp.departmentId) ?? [];
    arr.push(emp.salary);
    deptSalaries.set(emp.departmentId, arr);
  }

  const deptMedians = new Map<string, number>();
  for (const [deptId, salaries] of deptSalaries) {
    const sorted = [...salaries].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    deptMedians.set(
      deptId,
      sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid],
    );
  }

  // Score each employee
  const scored: AttritionRiskEmployee[] = employees.map((emp) => {
    const sickDays = emp.leaveRecords.reduce((s, lr) => s + lr.days, 0);
    const median = deptMedians.get(emp.departmentId) ?? emp.salary;
    const terminated = terminationMap.get(emp.departmentId) ?? 0;
    const total = totalMap.get(emp.departmentId) ?? 1;

    const tenureF = getTenureRisk(emp.hireDate);
    const absenceF = getAbsenceRisk(sickDays);
    const salaryF = getSalaryRisk(emp.salary, median);
    const deptF = getDeptTerminationRisk(terminated, total);

    const score = Math.min(100, tenureF + absenceF + salaryF + deptF);

    return {
      id: emp.id,
      name: `${emp.firstName} ${emp.lastName}`,
      position: emp.position,
      department: emp.department.name,
      departmentColor: emp.department.color ?? '#6366f1',
      tenureMonths: Math.round((Date.now() - emp.hireDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)),
      score,
      level: getRiskLevel(score),
      factors: { tenure: tenureF, absence: absenceF, salary: salaryF, dept: deptF },
    };
  });

  scored.sort((a, b) => b.score - a.score);

  // Department summaries
  const deptAgg = new Map<string, { name: string; color: string; scores: number[]; high: number; medium: number }>();
  for (const emp of scored) {
    const entry = deptAgg.get(emp.department) ?? {
      name: emp.department,
      color: emp.departmentColor,
      scores: [],
      high: 0,
      medium: 0,
    };
    entry.scores.push(emp.score);
    if (emp.level === 'HIGH') entry.high++;
    else if (emp.level === 'MEDIUM') entry.medium++;
    deptAgg.set(emp.department, entry);
  }

  const deptSummaries: DeptRiskSummary[] = Array.from(deptAgg.values())
    .map((d) => ({
      name: d.name,
      color: d.color,
      avgScore: Math.round(d.scores.reduce((s, v) => s + v, 0) / d.scores.length),
      highRiskCount: d.high,
      mediumRiskCount: d.medium,
      totalCount: d.scores.length,
    }))
    .sort((a, b) => b.avgScore - a.avgScore);

  const highRiskCount = scored.filter((e) => e.level === 'HIGH').length;
  const mediumRiskCount = scored.filter((e) => e.level === 'MEDIUM').length;
  const lowRiskCount = scored.filter((e) => e.level === 'LOW').length;
  const avgScore =
    scored.length > 0 ? Math.round(scored.reduce((s, e) => s + e.score, 0) / scored.length) : 0;

  return {
    employees: scored,
    deptSummaries,
    highRiskCount,
    mediumRiskCount,
    lowRiskCount,
    avgScore,
    totalAnalyzed: scored.length,
  };
}

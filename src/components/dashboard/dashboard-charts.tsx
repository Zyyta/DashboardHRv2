'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardStats } from '@/types';

function ChartSkeleton({ className }: { className?: string }) {
  return <Skeleton className={`w-full rounded-xl ${className ?? 'h-[420px]'}`} />;
}

const HeadcountChart = dynamic(
  () =>
    import('@/components/charts/headcount-chart').then((mod) => ({
      default: mod.HeadcountChart,
    })),
  { ssr: false, loading: () => <ChartSkeleton className="h-[420px]" /> }
);

const DepartmentChart = dynamic(
  () =>
    import('@/components/charts/department-chart').then((mod) => ({
      default: mod.DepartmentChart,
    })),
  { ssr: false, loading: () => <ChartSkeleton className="h-[420px]" /> }
);

const TurnoverChart = dynamic(
  () =>
    import('@/components/charts/turnover-chart').then((mod) => ({
      default: mod.TurnoverChart,
    })),
  { ssr: false, loading: () => <ChartSkeleton className="h-[420px]" /> }
);

const AgePyramidChart = dynamic(
  () =>
    import('@/components/charts/age-pyramid-chart').then((mod) => ({
      default: mod.AgePyramidChart,
    })),
  { ssr: false, loading: () => <ChartSkeleton className="h-[450px]" /> }
);

const GenderChart = dynamic(
  () =>
    import('@/components/charts/gender-chart').then((mod) => ({
      default: mod.GenderChart,
    })),
  { ssr: false, loading: () => <ChartSkeleton className="h-[420px]" /> }
);

const AbsenceChart = dynamic(
  () =>
    import('@/components/charts/absence-chart').then((mod) => ({
      default: mod.AbsenceChart,
    })),
  { ssr: false, loading: () => <ChartSkeleton className="h-[420px]" /> }
);

const SalaryEquityChart = dynamic(
  () =>
    import('@/components/charts/salary-equity-chart').then((mod) => ({
      default: mod.SalaryEquityChart,
    })),
  { ssr: false, loading: () => <ChartSkeleton className="h-[420px]" /> }
);

interface DashboardChartsProps {
  stats: DashboardStats;
}

export function DashboardCharts({ stats }: DashboardChartsProps) {
  return (
    <>
      <div className="grid gap-6 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <HeadcountChart data={stats.monthlyHeadcount} />
        </div>
        <div className="lg:col-span-3">
          <DepartmentChart data={stats.departmentDistribution} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TurnoverChart data={stats.monthlyTurnover} />
        <AbsenceChart data={stats.monthlyAbsence} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <AgePyramidChart data={stats.agePyramid} />
        <GenderChart data={stats.genderDistribution} />
        <SalaryEquityChart data={stats.salaryEquity} />
      </div>
    </>
  );
}

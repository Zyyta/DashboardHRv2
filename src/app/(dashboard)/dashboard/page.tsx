import type { Metadata } from 'next';
import { DashboardHeader } from '@/components/dashboard/header';
import { KpiCards } from '@/components/dashboard/kpi-cards';
import { DashboardCharts } from '@/components/dashboard/dashboard-charts';
import { getDashboardStats } from '@/actions/dashboard';

export const metadata: Metadata = {
  title: 'Tableau de bord | PeopleView',
};

export default async function DashboardPage() {
  let stats;
  try {
    stats = await getDashboardStats();
  } catch {
    return (
      <div className="flex flex-1 flex-col">
        <DashboardHeader title="Tableau de bord" />
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="text-center space-y-3">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold">Données non disponibles</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              La base de données n&apos;est pas encore configurée. Lancez <code className="rounded bg-muted px-1 py-0.5 text-xs">npm run db:seed</code> pour charger les données de démonstration.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader title="Tableau de bord" />
      <div className="flex-1 space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Tableau de bord
          </h1>
          <p className="text-muted-foreground">
            Vue d&apos;ensemble des indicateurs RH de votre organisation.
          </p>
        </div>

        <KpiCards
          stats={{
            totalEmployees: stats.totalEmployees,
            newHires: stats.newHires,
            turnoverRate: stats.turnoverRate,
            absenteeismRate: stats.absenteeismRate,
            averageTenure: stats.averageTenure,
          }}
        />

        <DashboardCharts stats={stats} />
      </div>
    </div>
  );
}

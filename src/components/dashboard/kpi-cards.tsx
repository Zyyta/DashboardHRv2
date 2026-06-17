'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingDown, CalendarOff, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DashboardStats } from '@/types';

type ChangeType = 'positive' | 'negative' | 'neutral';

interface KpiCardsProps {
  stats: Pick<DashboardStats, 'totalEmployees' | 'newHires' | 'turnoverRate' | 'absenteeismRate' | 'averageTenure'>;
}

const changeBadgeStyles: Record<ChangeType, string> = {
  positive: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  negative: 'bg-red-500/10 text-red-700 dark:text-red-400',
  neutral: 'bg-muted text-muted-foreground',
};

const iconColors: Record<number, string> = {
  0: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  1: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  2: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  3: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
};

function turnoverChangeType(rate: number): ChangeType {
  if (rate < 5) return 'positive';
  if (rate < 10) return 'neutral';
  return 'negative';
}

function absenteeismChangeType(rate: number): ChangeType {
  if (rate < 3) return 'positive';
  return 'negative';
}

export function KpiCards({ stats }: KpiCardsProps) {
  const { totalEmployees, newHires, turnoverRate, absenteeismRate, averageTenure } = stats;

  const kpiData = [
    {
      title: 'Total Employés',
      value: totalEmployees.toLocaleString('fr-FR'),
      change: newHires > 0 ? `+${newHires} ce mois` : 'Stable',
      changeType: (newHires > 0 ? 'positive' : 'neutral') as ChangeType,
      icon: Users,
      description: 'effectif total',
    },
    {
      title: 'Taux de Turnover',
      value: `${turnoverRate}%`,
      change: turnoverRate < 5 ? '✓ Objectif atteint' : turnoverRate < 10 ? '⚠ À surveiller' : '✕ Au-dessus objectif',
      changeType: turnoverChangeType(turnoverRate),
      icon: TrendingDown,
      description: 'moyenne 12 mois',
    },
    {
      title: 'Absentéisme',
      value: `${absenteeismRate}%`,
      change: absenteeismRate < 3 ? '✓ Dans les normes' : absenteeismRate < 6 ? '⚠ Seuil acceptable' : '✕ Seuil critique',
      changeType: absenteeismChangeType(absenteeismRate),
      icon: CalendarOff,
      description: 'ce mois-ci',
    },
    {
      title: 'Ancienneté Moyenne',
      value: `${averageTenure} ans`,
      change: averageTenure >= 3 ? '✓ Bonne rétention' : '⚠ Équipe jeune',
      changeType: (averageTenure >= 3 ? 'positive' : 'neutral') as ChangeType,
      icon: Clock,
      description: 'tous départements',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpiData.map((kpi, index) => {
        const Icon = kpi.icon;

        return (
          <Card
            key={kpi.title}
            className={cn(
              'transition-all duration-300 hover:shadow-lg hover:-translate-y-1'
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full',
                  iconColors[index]
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">
                {kpi.value}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={cn(
                    'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
                    changeBadgeStyles[kpi.changeType]
                  )}
                >
                  {kpi.change}
                </span>
                <span className="text-xs text-muted-foreground">
                  {kpi.description}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

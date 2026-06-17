import type { Metadata } from 'next';
import type { Route } from 'next';
import Link from 'next/link';
import { AlertTriangle, AlertCircle, CheckCircle2, Users, TrendingUp, Info } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getAttritionRiskData } from '@/actions/analytics';

export const metadata: Metadata = {
  title: 'Analytique | PeopleView',
};

const RISK_CONFIG = {
  HIGH: {
    label: 'Risque élevé',
    badge: 'bg-red-500/10 text-red-600 border-red-200 dark:text-red-400',
    bar: 'bg-red-500',
    icon: AlertCircle,
  },
  MEDIUM: {
    label: 'Risque modéré',
    badge: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:text-amber-400',
    bar: 'bg-amber-500',
    icon: AlertTriangle,
  },
  LOW: {
    label: 'Risque faible',
    badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:text-emerald-400',
    bar: 'bg-emerald-500',
    icon: CheckCircle2,
  },
} as const;

function ScoreBar({ score, level }: { score: number; level: 'LOW' | 'MEDIUM' | 'HIGH' }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="flex-1 bg-muted rounded-full h-2 min-w-[80px]">
        <div
          className={`h-2 rounded-full transition-all ${RISK_CONFIG[level].bar}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-sm font-semibold tabular-nums w-8 text-right">{score}</span>
    </div>
  );
}

function RiskBadge({ level }: { level: 'LOW' | 'MEDIUM' | 'HIGH' }) {
  const cfg = RISK_CONFIG[level];
  return (
    <Badge variant="outline" className={`text-xs font-medium ${cfg.badge}`}>
      {cfg.label}
    </Badge>
  );
}

function FactorPill({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex flex-col gap-0.5 min-w-[56px]">
      <div className="text-[10px] text-muted-foreground text-center">{label}</div>
      <div className="h-1.5 w-full bg-muted rounded-full">
        <div
          className="h-1.5 bg-primary/60 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-[10px] text-center font-medium">{value}</div>
    </div>
  );
}

export default async function AnalyticsPage() {
  let data;
  try {
    data = await getAttritionRiskData();
  } catch {
    return (
      <div className="flex flex-1 flex-col">
        <DashboardHeader title="Analytique" />
        <div className="flex flex-1 items-center justify-center p-6">
          <p className="text-muted-foreground">Données non disponibles.</p>
        </div>
      </div>
    );
  }

  const { employees, deptSummaries, highRiskCount, mediumRiskCount, lowRiskCount, avgScore, totalAnalyzed } = data;

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader
        title="Analytique"
        breadcrumbs={[{ label: 'PeopleView', href: '/dashboard' }, { label: 'Analytique' }]}
      />

      <div className="flex-1 space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Risque d&apos;attrition</h1>
          <p className="text-muted-foreground">
            Score prédictif calculé sur {totalAnalyzed} employé{totalAnalyzed !== 1 ? 's' : ''} actifs
            · Tenure, absences maladie, équité salariale, turnover départemental
          </p>
        </div>

        {/* KPI Row */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-red-200 dark:border-red-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Risque élevé</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <p className="text-4xl font-bold text-red-500">{highRiskCount}</p>
                <AlertCircle className="h-8 w-8 text-red-500/30" />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {totalAnalyzed > 0 ? Math.round((highRiskCount / totalAnalyzed) * 100) : 0}% de l&apos;effectif actif
              </p>
            </CardContent>
          </Card>

          <Card className="border-amber-200 dark:border-amber-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Risque modéré</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <p className="text-4xl font-bold text-amber-500">{mediumRiskCount}</p>
                <AlertTriangle className="h-8 w-8 text-amber-500/30" />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {totalAnalyzed > 0 ? Math.round((mediumRiskCount / totalAnalyzed) * 100) : 0}% de l&apos;effectif actif
              </p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 dark:border-emerald-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Risque faible</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <p className="text-4xl font-bold text-emerald-500">{lowRiskCount}</p>
                <CheckCircle2 className="h-8 w-8 text-emerald-500/30" />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {totalAnalyzed > 0 ? Math.round((lowRiskCount / totalAnalyzed) * 100) : 0}% de l&apos;effectif actif
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Score moyen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <p className="text-4xl font-bold">{avgScore}<span className="text-lg text-muted-foreground">/100</span></p>
                <TrendingUp className="h-8 w-8 text-primary/30" />
              </div>
              <div className="mt-2 h-2 w-full bg-muted rounded-full">
                <div
                  className={`h-2 rounded-full ${avgScore > 55 ? 'bg-red-500' : avgScore > 30 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${avgScore}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main employee risk table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Employés à surveiller</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Classés par score de risque décroissant — cliquez sur un nom pour voir le profil complet
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5" />
              <span>Score 0–100</span>
            </div>
          </CardHeader>
          <CardContent>
            {employees.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground/30" />
                <p className="text-muted-foreground">Aucun employé actif à analyser.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="pb-3 text-left font-medium">Employé</th>
                      <th className="pb-3 text-left font-medium">Département</th>
                      <th className="pb-3 text-left font-medium">Ancienneté</th>
                      <th className="pb-3 text-left font-medium">Niveau</th>
                      <th className="pb-3 text-left font-medium min-w-[160px]">Score</th>
                      <th className="pb-3 text-left font-medium">Facteurs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {employees.slice(0, 20).map((emp) => (
                      <tr key={emp.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 pr-4">
                          <Link
                            href={`/dashboard/employees/${emp.id}` as Route}
                            className="font-medium hover:text-primary hover:underline transition-colors"
                          >
                            {emp.name}
                          </Link>
                          <p className="text-xs text-muted-foreground">{emp.position}</p>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="flex items-center gap-1.5">
                            <span
                              className="h-2 w-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: emp.departmentColor }}
                            />
                            {emp.department}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {emp.tenureMonths < 12
                            ? `${emp.tenureMonths} mois`
                            : `${Math.floor(emp.tenureMonths / 12)} an${Math.floor(emp.tenureMonths / 12) > 1 ? 's' : ''}`}
                        </td>
                        <td className="py-3 pr-4">
                          <RiskBadge level={emp.level} />
                        </td>
                        <td className="py-3 pr-6">
                          <ScoreBar score={emp.score} level={emp.level} />
                        </td>
                        <td className="py-3">
                          <div className="flex gap-2">
                            <FactorPill label="Tenure" value={emp.factors.tenure} max={40} />
                            <FactorPill label="Absences" value={emp.factors.absence} max={30} />
                            <FactorPill label="Salaire" value={emp.factors.salary} max={20} />
                            <FactorPill label="Dept." value={emp.factors.dept} max={10} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {employees.length > 20 && (
                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    +{employees.length - 20} employés supplémentaires non affichés
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Department risk overview */}
        <Card>
          <CardHeader>
            <CardTitle>Risque par département</CardTitle>
            <p className="text-sm text-muted-foreground">
              Score moyen et répartition des niveaux de risque par département
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deptSummaries.map((dept) => (
                <div key={dept.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: dept.color }}
                      />
                      <span className="font-medium">{dept.name}</span>
                      <span className="text-muted-foreground text-xs">({dept.totalCount} actifs)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {dept.highRiskCount > 0 && (
                        <span className="text-xs font-medium text-red-500">
                          {dept.highRiskCount} élevé{dept.highRiskCount > 1 ? 's' : ''}
                        </span>
                      )}
                      {dept.mediumRiskCount > 0 && (
                        <span className="text-xs font-medium text-amber-500">
                          {dept.mediumRiskCount} modéré{dept.mediumRiskCount > 1 ? 's' : ''}
                        </span>
                      )}
                      <span className="text-sm font-bold tabular-nums w-10 text-right">
                        {dept.avgScore}/100
                      </span>
                    </div>
                  </div>
                  <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        dept.avgScore > 55 ? 'bg-red-500' : dept.avgScore > 30 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${dept.avgScore}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Methodology note */}
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Méthodologie du score</p>
                <p>
                  Le score d&apos;attrition (0–100) est calculé à partir de 4 facteurs pondérés : ancienneté (max 40 pts, pic à 18–24 mois),
                  fréquence des absences maladie sur 12 mois (max 30 pts), écart par rapport au salaire médian du département (max 20 pts),
                  et taux de turnover du département (max 10 pts). Seuils : Faible ≤30, Modéré 31–55, Élevé &gt;55.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

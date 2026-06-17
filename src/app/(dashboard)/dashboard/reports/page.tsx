import type { Metadata } from 'next';
import { DashboardHeader } from '@/components/dashboard/header';
import {
  getDepartmentReport,
  getAbsenceReport,
  getTurnoverReport,
  getSalaryEquityReport,
  getOrgSummary,
} from '@/actions/reports';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const metadata: Metadata = {
  title: 'Rapports | PeopleView',
};

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

const fmtPct = (v: number) => `${v}%`;

const fmtNum = (v: number) => new Intl.NumberFormat('fr-FR').format(v);

function GapBadge({ pct, favorable }: { pct: number; favorable: 'men' | 'women' | 'equal' }) {
  if (favorable === 'equal' || pct === 0)
    return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">Parité</Badge>;
  const color = pct <= 3
    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
    : pct <= 7
    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
    : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
  return (
    <Badge variant="outline" className={color}>
      {pct}% {favorable === 'men' ? '↑H' : '↑F'}
    </Badge>
  );
}

function RateBadge({ rate, warn = 5, danger = 10 }: { rate: number; warn?: number; danger?: number }) {
  const color = rate >= danger
    ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
    : rate >= warn
    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
  return <Badge variant="outline" className={color}>{rate}%</Badge>;
}

export default async function ReportsPage() {
  let departments, absences, turnover, salaryEquity, summary;

  try {
    [departments, absences, turnover, salaryEquity, summary] = await Promise.all([
      getDepartmentReport(),
      getAbsenceReport(),
      getTurnoverReport(),
      getSalaryEquityReport(),
      getOrgSummary(),
    ]);
  } catch {
    return (
      <div className="flex flex-1 flex-col">
        <DashboardHeader title="Rapports" breadcrumbs={[{ label: 'PeopleView', href: '/dashboard' }, { label: 'Rapports' }]} />
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="text-center space-y-3">
            <h2 className="text-xl font-semibold">Données non disponibles</h2>
            <p className="text-sm text-muted-foreground">
              Lancez <code className="rounded bg-muted px-1 py-0.5 text-xs">npm run db:seed</code> pour charger les données de démonstration.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentYear = new Date().getFullYear();

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader
        title="Rapports"
        breadcrumbs={[
          { label: 'PeopleView', href: '/dashboard' },
          { label: 'Rapports' },
        ]}
      />

      <div className="flex-1 space-y-8 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rapports RH</h1>
          <p className="text-muted-foreground">
            Analyse complète des données RH — {currentYear}
          </p>
        </div>

        {/* ─── SECTION 1: Organisation Summary ─── */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Vue d&apos;ensemble Organisation</h2>
            <p className="text-sm text-muted-foreground">Indicateurs globaux clés</p>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
            {[
              { label: 'Effectif total', value: fmtNum(summary.totalEmployees), sub: `dont ${summary.activeEmployees} actifs` },
              { label: 'Embauches (30j)', value: `+${summary.newHiresLast30}`, sub: `+${summary.newHiresLast90} sur 90j` },
              { label: 'Turnover 12 mois', value: fmtPct(summary.turnoverRate12m), sub: `${summary.terminationsLast12m} départs` },
              { label: 'Absentéisme (30j)', value: fmtPct(summary.absenteeismRateLast30), sub: `${summary.onLeaveEmployees} en congé` },
              { label: 'Salaire moyen', value: fmtCurrency(summary.avgSalary), sub: `Masse: ${fmtCurrency(summary.totalPayroll)}` },
              { label: 'Ancienneté moy.', value: `${summary.avgTenureYears} ans`, sub: `Âge moy: ${summary.avgAge} ans` },
            ].map((item) => (
              <Card key={item.label}>
                <CardContent className="pt-4 pb-3">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight">{item.value}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{item.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ─── SECTION 2: Effectifs par Département ─── */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Effectifs par Département</h2>
            <p className="text-sm text-muted-foreground">
              Analyse complète des effectifs, salaires, ancienneté et parité par département
            </p>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Département</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Actifs</TableHead>
                  <TableHead className="text-right">Congés</TableHead>
                  <TableHead className="text-right">Partis</TableHead>
                  <TableHead className="text-right">Turnover</TableHead>
                  <TableHead className="text-right">Salaire moy.</TableHead>
                  <TableHead className="text-right">Sal. min</TableHead>
                  <TableHead className="text-right">Sal. max</TableHead>
                  <TableHead className="text-right">Ancienneté</TableHead>
                  <TableHead className="text-right">Hommes</TableHead>
                  <TableHead className="text-right">Femmes</TableHead>
                  <TableHead className="text-right">% Femmes</TableHead>
                  <TableHead className="text-right">Âge moy.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <div className="flex items-center gap-2 font-medium">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color ?? '#6366f1' }} />
                        {d.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{d.total}</TableCell>
                    <TableCell className="text-right text-emerald-600 dark:text-emerald-400">{d.active}</TableCell>
                    <TableCell className="text-right text-amber-600 dark:text-amber-400">{d.onLeave}</TableCell>
                    <TableCell className="text-right text-red-600 dark:text-red-400">{d.terminated}</TableCell>
                    <TableCell className="text-right">
                      <RateBadge rate={d.turnoverRate} />
                    </TableCell>
                    <TableCell className="text-right font-medium">{fmtCurrency(d.avgSalary)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{fmtCurrency(d.minSalary)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{fmtCurrency(d.maxSalary)}</TableCell>
                    <TableCell className="text-right">{d.avgTenureYears} ans</TableCell>
                    <TableCell className="text-right">{d.maleCount}</TableCell>
                    <TableCell className="text-right">{d.femaleCount}</TableCell>
                    <TableCell className="text-right">
                      <span className={d.genderRatioPct >= 40 && d.genderRatioPct <= 60 ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-amber-600 dark:text-amber-400 font-medium'}>
                        {d.genderRatioPct}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{d.avgAge} ans</TableCell>
                  </TableRow>
                ))}
                {/* Totals row */}
                <TableRow className="border-t-2 font-semibold bg-muted/30">
                  <TableCell className="font-bold">TOTAL</TableCell>
                  <TableCell className="text-right font-bold">{departments.reduce((s, d) => s + d.total, 0)}</TableCell>
                  <TableCell className="text-right text-emerald-600 dark:text-emerald-400">{departments.reduce((s, d) => s + d.active, 0)}</TableCell>
                  <TableCell className="text-right text-amber-600 dark:text-amber-400">{departments.reduce((s, d) => s + d.onLeave, 0)}</TableCell>
                  <TableCell className="text-right text-red-600 dark:text-red-400">{departments.reduce((s, d) => s + d.terminated, 0)}</TableCell>
                  <TableCell className="text-right">—</TableCell>
                  <TableCell className="text-right">{fmtCurrency(summary.avgSalary)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">—</TableCell>
                  <TableCell className="text-right text-muted-foreground">—</TableCell>
                  <TableCell className="text-right">{summary.avgTenureYears} ans</TableCell>
                  <TableCell className="text-right">{summary.maleCount}</TableCell>
                  <TableCell className="text-right">{summary.femaleCount}</TableCell>
                  <TableCell className="text-right">
                    {summary.maleCount + summary.femaleCount > 0
                      ? Math.round((summary.femaleCount / (summary.maleCount + summary.femaleCount)) * 100)
                      : 0}%
                  </TableCell>
                  <TableCell className="text-right">{summary.avgAge} ans</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </section>

        {/* ─── SECTION 3: Absences 12 mois ─── */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Analyse des Absences — 12 derniers mois</h2>
            <p className="text-sm text-muted-foreground">
              Répartition mensuelle par type d&apos;absence avec taux et employés impactés
            </p>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mois</TableHead>
                  <TableHead className="text-right">Taux abs.</TableHead>
                  <TableHead className="text-right">Jours total</TableHead>
                  <TableHead className="text-right">Employés</TableHead>
                  <TableHead className="text-right">Absences</TableHead>
                  <TableHead className="text-right">Congés payés</TableHead>
                  <TableHead className="text-right">Maladie</TableHead>
                  <TableHead className="text-right">Maternité</TableHead>
                  <TableHead className="text-right">Paternité</TableHead>
                  <TableHead className="text-right">Sans solde</TableHead>
                  <TableHead className="text-right">Autre</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {absences.map((m) => (
                  <TableRow key={m.month}>
                    <TableCell className="font-medium">{m.monthLabel}</TableCell>
                    <TableCell className="text-right">
                      <RateBadge rate={m.absenceRate} warn={3} danger={6} />
                    </TableCell>
                    <TableCell className="text-right font-medium">{m.totalDays}</TableCell>
                    <TableCell className="text-right">{m.employeesAffected}</TableCell>
                    <TableCell className="text-right">{m.records}</TableCell>
                    <TableCell className="text-right text-blue-600 dark:text-blue-400">{m.vacationDays > 0 ? m.vacationDays : '—'}</TableCell>
                    <TableCell className="text-right text-amber-600 dark:text-amber-400">{m.sickDays > 0 ? m.sickDays : '—'}</TableCell>
                    <TableCell className="text-right text-pink-600 dark:text-pink-400">{m.maternityDays > 0 ? m.maternityDays : '—'}</TableCell>
                    <TableCell className="text-right text-sky-600 dark:text-sky-400">{m.paternityDays > 0 ? m.paternityDays : '—'}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{m.unpaidDays > 0 ? m.unpaidDays : '—'}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{m.otherDays > 0 ? m.otherDays : '—'}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-t-2 font-semibold bg-muted/30">
                  <TableCell className="font-bold">TOTAL 12 MOIS</TableCell>
                  <TableCell className="text-right">—</TableCell>
                  <TableCell className="text-right font-bold">{absences.reduce((s, m) => s + m.totalDays, 0)}</TableCell>
                  <TableCell className="text-right">—</TableCell>
                  <TableCell className="text-right">{absences.reduce((s, m) => s + m.records, 0)}</TableCell>
                  <TableCell className="text-right">{absences.reduce((s, m) => s + m.vacationDays, 0)}</TableCell>
                  <TableCell className="text-right">{absences.reduce((s, m) => s + m.sickDays, 0)}</TableCell>
                  <TableCell className="text-right">{absences.reduce((s, m) => s + m.maternityDays, 0)}</TableCell>
                  <TableCell className="text-right">{absences.reduce((s, m) => s + m.paternityDays, 0)}</TableCell>
                  <TableCell className="text-right">{absences.reduce((s, m) => s + m.unpaidDays, 0)}</TableCell>
                  <TableCell className="text-right">{absences.reduce((s, m) => s + m.otherDays, 0)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </section>

        {/* ─── SECTION 4: Turnover par département ─── */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Analyse du Turnover — 12 derniers mois</h2>
            <p className="text-sm text-muted-foreground">
              Départs par département, motif de départ et ancienneté moyenne au départ
            </p>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Département</TableHead>
                  <TableHead className="text-right">Effectif</TableHead>
                  <TableHead className="text-right">Départs</TableHead>
                  <TableHead className="text-right">Taux</TableHead>
                  <TableHead className="text-right">Démissions</TableHead>
                  <TableHead className="text-right">Licenciements</TableHead>
                  <TableHead className="text-right">Rupt. conv.</TableHead>
                  <TableHead className="text-right">Fin contrat</TableHead>
                  <TableHead className="text-right">Retraite</TableHead>
                  <TableHead className="text-right">Autre</TableHead>
                  <TableHead className="text-right">Anc. moy. départ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {turnover.map((d) => (
                  <TableRow key={d.departmentName}>
                    <TableCell>
                      <div className="flex items-center gap-2 font-medium">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.departmentColor ?? '#6366f1' }} />
                        {d.departmentName}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{d.totalHeadcount}</TableCell>
                    <TableCell className="text-right font-semibold">{d.totalDepartures}</TableCell>
                    <TableCell className="text-right">
                      <RateBadge rate={d.turnoverRate} />
                    </TableCell>
                    <TableCell className="text-right">{d.resignations > 0 ? d.resignations : '—'}</TableCell>
                    <TableCell className="text-right text-red-600 dark:text-red-400">{d.layoffs > 0 ? d.layoffs : '—'}</TableCell>
                    <TableCell className="text-right">{d.mutual > 0 ? d.mutual : '—'}</TableCell>
                    <TableCell className="text-right">{d.endOfContract > 0 ? d.endOfContract : '—'}</TableCell>
                    <TableCell className="text-right">{d.retirement > 0 ? d.retirement : '—'}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{d.other > 0 ? d.other : '—'}</TableCell>
                    <TableCell className="text-right">
                      {d.avgTenureAtDeparture > 0 ? `${Math.round(d.avgTenureAtDeparture)} mois` : '—'}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-t-2 font-semibold bg-muted/30">
                  <TableCell className="font-bold">TOTAL</TableCell>
                  <TableCell className="text-right">{turnover.reduce((s, d) => s + d.totalHeadcount, 0)}</TableCell>
                  <TableCell className="text-right font-bold">{turnover.reduce((s, d) => s + d.totalDepartures, 0)}</TableCell>
                  <TableCell className="text-right">
                    <RateBadge rate={summary.turnoverRate12m} />
                  </TableCell>
                  <TableCell className="text-right">{turnover.reduce((s, d) => s + d.resignations, 0)}</TableCell>
                  <TableCell className="text-right">{turnover.reduce((s, d) => s + d.layoffs, 0)}</TableCell>
                  <TableCell className="text-right">{turnover.reduce((s, d) => s + d.mutual, 0)}</TableCell>
                  <TableCell className="text-right">{turnover.reduce((s, d) => s + d.endOfContract, 0)}</TableCell>
                  <TableCell className="text-right">{turnover.reduce((s, d) => s + d.retirement, 0)}</TableCell>
                  <TableCell className="text-right">{turnover.reduce((s, d) => s + d.other, 0)}</TableCell>
                  <TableCell className="text-right">—</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </section>

        {/* ─── SECTION 5: Parité Salariale ─── */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Rapport Parité Salariale (Index Égapro)</h2>
            <p className="text-sm text-muted-foreground">
              Comparaison détaillée des salaires hommes/femmes par département — écart, min, max
            </p>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Département</TableHead>
                  <TableHead className="text-right">H (effectif)</TableHead>
                  <TableHead className="text-right">F (effectif)</TableHead>
                  <TableHead className="text-right">Sal. moy. H</TableHead>
                  <TableHead className="text-right">Sal. moy. F</TableHead>
                  <TableHead className="text-right">Min H</TableHead>
                  <TableHead className="text-right">Max H</TableHead>
                  <TableHead className="text-right">Min F</TableHead>
                  <TableHead className="text-right">Max F</TableHead>
                  <TableHead className="text-right">Écart €</TableHead>
                  <TableHead className="text-right">Écart %</TableHead>
                  <TableHead>Indice</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salaryEquity.map((d) => (
                  <TableRow key={d.departmentName}>
                    <TableCell>
                      <div className="flex items-center gap-2 font-medium">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.departmentColor ?? '#6366f1' }} />
                        {d.departmentName}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-blue-600 dark:text-blue-400">{d.maleCount}</TableCell>
                    <TableCell className="text-right text-pink-600 dark:text-pink-400">{d.femaleCount}</TableCell>
                    <TableCell className="text-right font-medium">{fmtCurrency(d.maleAvg)}</TableCell>
                    <TableCell className="text-right font-medium">{fmtCurrency(d.femaleAvg)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{fmtCurrency(d.maleMin)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{fmtCurrency(d.maleMax)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{fmtCurrency(d.femaleMin)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{fmtCurrency(d.femaleMax)}</TableCell>
                    <TableCell className="text-right font-medium">{fmtCurrency(d.gapAmount)}</TableCell>
                    <TableCell className="text-right font-medium">{d.gapPct}%</TableCell>
                    <TableCell>
                      <GapBadge pct={d.gapPct} favorable={d.gapFavorable} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-amber-600 dark:text-amber-400">
                Note légale — Index Égapro
              </CardTitle>
              <CardDescription>
                Les entreprises de plus de 50 salariés sont tenues de publier leur Index d&apos;égalité professionnelle chaque année avant le 1er mars.
                Un écart &gt; 5% sans justification expose l&apos;entreprise à des pénalités pouvant atteindre 1% de la masse salariale.
              </CardDescription>
            </CardHeader>
          </Card>
        </section>
      </div>
    </div>
  );
}

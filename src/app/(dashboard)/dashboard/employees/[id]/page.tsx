import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { DashboardHeader } from '@/components/dashboard/header';
import { getEmployeeById } from '@/actions/employees';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Building2,
  Euro,
  ArrowLeft,
  Clock,
} from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Actif',
  ON_LEAVE: 'En congé',
  TERMINATED: 'Parti',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  ON_LEAVE: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  TERMINATED: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
};

const LEAVE_TYPE_LABELS: Record<string, string> = {
  VACATION: 'Congé payé',
  SICK: 'Maladie',
  MATERNITY: 'Maternité',
  PATERNITY: 'Paternité',
  UNPAID: 'Sans solde',
  OTHER: 'Autre',
};

const LEAVE_STATUS_COLORS: Record<string, string> = {
  APPROVED: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  PENDING: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  REJECTED: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
};

const LEAVE_STATUS_LABELS: Record<string, string> = {
  APPROVED: 'Approuvé',
  PENDING: 'En attente',
  REJECTED: 'Refusé',
};

const TERMINATION_REASON_LABELS: Record<string, string> = {
  RESIGNATION: 'Démission',
  LAYOFF: 'Licenciement',
  MUTUAL: 'Rupture conventionnelle',
  END_OF_CONTRACT: 'Fin de contrat',
  RETIREMENT: 'Retraite',
  OTHER: 'Autre',
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

function formatSalary(salary: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(salary);
}

function calculateAge(dateOfBirth: Date): number {
  const now = new Date();
  const dob = new Date(dateOfBirth);
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const employee = await getEmployeeById(id);
  if (!employee) return { title: 'Employé introuvable | PeopleView' };
  return {
    title: `${employee.firstName} ${employee.lastName} | PeopleView`,
  };
}

export default async function EmployeeProfilePage({ params }: PageProps) {
  const { id } = await params;
  const employee = await getEmployeeById(id);

  if (!employee) notFound();

  const initials = `${employee.firstName[0]}${employee.lastName[0]}`;
  const deptColor = employee.department.color ?? '#6366f1';

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader
        title={`${employee.firstName} ${employee.lastName}`}
        breadcrumbs={[
          { label: 'PeopleView', href: '/dashboard' },
          { label: 'Employés', href: '/dashboard/employees' },
          { label: `${employee.firstName} ${employee.lastName}` },
        ]}
      />

      <div className="flex-1 space-y-6 p-6">
        <Link
          href="/dashboard/employees"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux employés
        </Link>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Profile card */}
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div
                    className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white shadow-lg"
                    style={{ backgroundColor: deptColor }}
                  >
                    {initials}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">
                      {employee.firstName} {employee.lastName}
                    </h2>
                    <p className="text-sm text-muted-foreground">{employee.position}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={STATUS_COLORS[employee.status]}
                  >
                    {STATUS_LABELS[employee.status]}
                  </Badge>
                </div>

                <div className="mt-6 space-y-3 border-t pt-6">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{employee.email}</span>
                  </div>
                  {employee.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{employee.phone}</span>
                    </div>
                  )}
                  {employee.address && (
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{employee.address}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Informations RH</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10">
                    <Building2 className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Département</p>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: deptColor }}
                      />
                      <p className="text-sm font-medium">{employee.department.name}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/10">
                    <Calendar className="h-4 w-4 text-violet-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date d&apos;embauche</p>
                    <p className="text-sm font-medium">{formatDate(employee.hireDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10">
                    <Clock className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Ancienneté</p>
                    <p className="text-sm font-medium">{employee.tenureYears} ans</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10">
                    <Euro className="h-4 w-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Salaire annuel</p>
                    <p className="text-sm font-medium">{formatSalary(employee.salary)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-500/10">
                    <Briefcase className="h-4 w-4 text-pink-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Âge</p>
                    <p className="text-sm font-medium">
                      {calculateAge(employee.dateOfBirth)} ans
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {employee.terminationRecord && (
              <Card className="border-red-500/20">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400">
                    Départ
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="font-medium">
                      {formatDate(employee.terminationRecord.terminationDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Motif</p>
                    <p className="font-medium">
                      {TERMINATION_REASON_LABELS[employee.terminationRecord.reason] ??
                        employee.terminationRecord.reason}
                    </p>
                  </div>
                  {employee.terminationRecord.notes && (
                    <div>
                      <p className="text-xs text-muted-foreground">Notes</p>
                      <p className="text-muted-foreground">
                        {employee.terminationRecord.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Activity timeline */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Historique des Absences & Congés</CardTitle>
              </CardHeader>
              <CardContent>
                {employee.leaveRecords.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Aucun congé enregistré.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {employee.leaveRecords.map((leave) => (
                      <div
                        key={leave.id}
                        className="flex items-start gap-4 rounded-lg border p-4"
                      >
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium">
                              {LEAVE_TYPE_LABELS[leave.type] ?? leave.type}
                            </p>
                            <Badge
                              variant="outline"
                              className={
                                LEAVE_STATUS_COLORS[leave.status] ??
                                'bg-muted text-muted-foreground'
                              }
                            >
                              {LEAVE_STATUS_LABELS[leave.status] ?? leave.status}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDate(leave.startDate)} → {formatDate(leave.endDate)}{' '}
                            <span className="font-medium text-foreground">
                              ({leave.days} jour{leave.days !== 1 ? 's' : ''})
                            </span>
                          </p>
                          {leave.reason && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {leave.reason}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statistiques de Présence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg border p-4 text-center">
                    <p className="text-2xl font-bold">
                      {employee.leaveRecords.filter((l) => l.status === 'APPROVED').length}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">Congés approuvés</p>
                  </div>
                  <div className="rounded-lg border p-4 text-center">
                    <p className="text-2xl font-bold">
                      {employee.leaveRecords
                        .filter((l) => l.status === 'APPROVED')
                        .reduce((sum, l) => sum + l.days, 0)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">Jours d&apos;absence</p>
                  </div>
                  <div className="rounded-lg border p-4 text-center">
                    <p className="text-2xl font-bold">
                      {employee.leaveRecords.filter((l) => l.type === 'SICK').length}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">Arrêts maladie</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

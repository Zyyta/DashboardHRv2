import type { Metadata, Route } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { DashboardHeader } from '@/components/dashboard/header';
import { getEmployees, getDepartmentsForFilter } from '@/actions/employees';
import { EmployeeFilters } from '@/components/employees/employee-filters';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, Clock, UserX } from 'lucide-react';
import type { EmployeeStatus } from '@prisma/client';

export const metadata: Metadata = {
  title: 'Employés | PeopleView',
};

const STATUS_LABELS: Record<EmployeeStatus, string> = {
  ACTIVE: 'Actif',
  ON_LEAVE: 'En congé',
  TERMINATED: 'Parti',
};

const STATUS_COLORS: Record<EmployeeStatus, string> = {
  ACTIVE: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  ON_LEAVE: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  TERMINATED: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
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

interface PageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    dept?: string;
    page?: string;
  }>;
}

export default async function EmployeesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = params.q ?? '';
  const statusFilter = (params.status ?? 'ALL') as EmployeeStatus | 'ALL';
  const deptFilter = params.dept ?? '';
  const page = Number(params.page ?? '1');

  const [{ employees, total, pageSize }, departments] = await Promise.all([
    getEmployees({
      search,
      status: statusFilter,
      departmentId: deptFilter || undefined,
      page,
      pageSize: 20,
    }),
    getDepartmentsForFilter(),
  ]);

  const activeCount = employees.filter((e) => e.status === 'ACTIVE').length;
  const onLeaveCount = employees.filter((e) => e.status === 'ON_LEAVE').length;
  const terminatedCount = employees.filter((e) => e.status === 'TERMINATED').length;
  const totalPages = Math.ceil(total / pageSize);

  function buildUrl(overrides: Record<string, string | undefined>): Route {
    const next = new URLSearchParams();
    if (search) next.set('q', search);
    if (statusFilter !== 'ALL') next.set('status', statusFilter);
    if (deptFilter) next.set('dept', deptFilter);
    if (page > 1) next.set('page', String(page));
    Object.entries(overrides).forEach(([k, v]) => {
      if (v === undefined || v === '') next.delete(k);
      else next.set(k, v);
    });
    const qs = next.toString();
    return `/dashboard/employees${qs ? `?${qs}` : ''}` as Route;
  }

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader
        title="Employés"
        breadcrumbs={[
          { label: 'PeopleView', href: '/dashboard' },
          { label: 'Employés' },
        ]}
      />

      <div className="flex-1 space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employés</h1>
          <p className="text-muted-foreground">
            {total} employé{total !== 1 ? 's' : ''} dans votre organisation.
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Actifs</CardTitle>
              <UserCheck className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {activeCount}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">En congé</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {onLeaveCount}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Partis</CardTitle>
              <UserX className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {terminatedCount}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Suspense>
          <EmployeeFilters
            departments={departments}
            defaultSearch={search}
            defaultStatus={statusFilter}
            defaultDept={deptFilter || 'ALL'}
          />
        </Suspense>

        {/* Table */}
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Poste</TableHead>
                <TableHead>Département</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Embauche</TableHead>
                <TableHead>Ancienneté</TableHead>
                <TableHead className="text-right">Salaire</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    Aucun employé trouvé.
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((employee) => (
                  <TableRow key={employee.id} className="group cursor-pointer">
                    <TableCell>
                      <Link
                        href={`/dashboard/employees/${employee.id}`}
                        className="flex items-center gap-3 font-medium hover:underline"
                      >
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                          style={{
                            backgroundColor: employee.department.color ?? '#6366f1',
                          }}
                        >
                          {employee.firstName[0]}
                          {employee.lastName[0]}
                        </div>
                        <span>
                          {employee.firstName} {employee.lastName}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {employee.position}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{
                            backgroundColor: employee.department.color ?? '#6366f1',
                          }}
                        />
                        {employee.department.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={STATUS_COLORS[employee.status]}
                      >
                        {STATUS_LABELS[employee.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(employee.hireDate)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {employee.tenureYears} ans
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatSalary(employee.salary)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Page {page} sur {totalPages} — {total} résultat{total !== 1 ? 's' : ''}
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={buildUrl({ page: String(page - 1) })}
                  className="rounded-md border px-3 py-1.5 hover:bg-muted"
                >
                  Précédent
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={buildUrl({ page: String(page + 1) })}
                  className="rounded-md border px-3 py-1.5 hover:bg-muted"
                >
                  Suivant
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

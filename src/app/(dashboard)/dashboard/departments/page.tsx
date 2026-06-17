import type { Metadata } from 'next';
import { DashboardHeader } from '@/components/dashboard/header';
import { DepartmentManager } from '@/components/departments/department-manager';
import { getDepartments } from '@/actions/departments';

export const metadata: Metadata = {
  title: 'Départements | PeopleView',
};

export default async function DepartmentsPage() {
  let departments;
  try {
    departments = await getDepartments();
  } catch {
    return (
      <div className="flex flex-1 flex-col">
        <DashboardHeader
          title="Départements"
          breadcrumbs={[{ label: 'PeopleView', href: '/dashboard' }, { label: 'Départements' }]}
        />
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="text-center space-y-3">
            <h2 className="text-xl font-semibold">Données non disponibles</h2>
            <p className="text-sm text-muted-foreground">
              Lancez <code className="rounded bg-muted px-1 py-0.5 text-xs">npm run db:seed</code> pour charger les données.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const totalEmployees = departments.reduce((s, d) => s + d.totalEmployees, 0);

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader
        title="Départements"
        breadcrumbs={[
          { label: 'PeopleView', href: '/dashboard' },
          { label: 'Départements' },
        ]}
      />
      <div className="flex-1 space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Départements</h1>
          <p className="text-muted-foreground">
            {departments.length} département{departments.length !== 1 ? 's' : ''} · {totalEmployees} employé{totalEmployees !== 1 ? 's' : ''} au total
          </p>
        </div>

        <DepartmentManager departments={departments} />
      </div>
    </div>
  );
}

import type { Metadata } from 'next';
import { DashboardHeader } from '@/components/dashboard/header';
import { CsvImportWizard } from '@/components/import/csv-import-wizard';

export const metadata: Metadata = {
  title: 'Import CSV | PeopleView',
};

export default function ImportPage() {
  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader
        title="Import CSV"
        breadcrumbs={[
          { label: 'PeopleView', href: '/dashboard' },
          { label: 'Employés', href: '/dashboard/employees' },
          { label: 'Import CSV' },
        ]}
      />
      <div className="flex-1 space-y-6 p-6 max-w-4xl mx-auto w-full">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Import de collaborateurs</h1>
          <p className="text-muted-foreground">
            Importez votre liste d&apos;employés depuis un fichier CSV. Le mapping des colonnes est automatique et personnalisable.
          </p>
        </div>
        <CsvImportWizard />
      </div>
    </div>
  );
}

import type { Metadata } from 'next';
import { DashboardHeader } from '@/components/dashboard/header';
import { SettingsManager } from '@/components/settings/settings-manager';
import { getOrgSettings } from '@/actions/settings';

export const metadata: Metadata = {
  title: 'Paramètres | PeopleView',
};

export default async function SettingsPage() {
  let settings;
  try {
    settings = await getOrgSettings();
  } catch {
    return (
      <div className="flex flex-1 flex-col">
        <DashboardHeader title="Paramètres" />
        <div className="flex flex-1 items-center justify-center p-6">
          <p className="text-muted-foreground">Impossible de charger les paramètres.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader
        title="Paramètres"
        breadcrumbs={[{ label: 'PeopleView', href: '/dashboard' }, { label: 'Paramètres' }]}
      />
      <div className="flex-1 p-6 max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
          <p className="text-muted-foreground">Gérez votre compte, votre organisation et votre abonnement.</p>
        </div>
        <SettingsManager settings={settings} />
      </div>
    </div>
  );
}

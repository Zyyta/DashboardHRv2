import type { Metadata } from 'next';
import { DashboardHeader } from '@/components/dashboard/header';
import { BillingManager } from '@/components/billing/billing-manager';
import { getBillingDetails } from '@/actions/billing';

export const metadata: Metadata = {
  title: 'Facturation | PeopleView',
};

interface PageProps {
  searchParams: Promise<{ checkout?: string }>;
}

export default async function BillingPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const checkoutResult =
    params.checkout === 'success' ? 'success' :
    params.checkout === 'canceled' ? 'canceled' :
    undefined;

  let billing;
  try {
    billing = await getBillingDetails();
  } catch {
    return (
      <div className="flex flex-1 flex-col">
        <DashboardHeader
          title="Facturation"
          breadcrumbs={[{ label: 'PeopleView', href: '/dashboard' }, { label: 'Facturation' }]}
        />
        <div className="flex flex-1 items-center justify-center p-6">
          <p className="text-muted-foreground">Données de facturation non disponibles.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader
        title="Facturation"
        breadcrumbs={[{ label: 'PeopleView', href: '/dashboard' }, { label: 'Facturation' }]}
      />

      <div className="flex-1 space-y-6 p-6 max-w-5xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Facturation</h1>
          <p className="text-muted-foreground">
            Gérez votre abonnement, votre moyen de paiement et consultez vos factures.
          </p>
        </div>

        <BillingManager billing={billing} checkoutResult={checkoutResult} />
      </div>
    </div>
  );
}

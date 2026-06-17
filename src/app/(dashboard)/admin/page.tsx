import type { Metadata } from 'next';
import { Shield } from 'lucide-react';
import { ComingSoon } from '@/components/dashboard/coming-soon';

export const metadata: Metadata = {
  title: 'Administration | PeopleView',
};

export default function AdminPage() {
  return (
    <ComingSoon
      title="Administration"
      description="Panneau d'administration de la plateforme."
      icon={Shield}
      features={[
        'Gestion des organisations',
        'Supervision des abonnements',
        'Journaux d\'activité',
        'Configuration système',
      ]}
    />
  );
}

import type { Metadata } from 'next';
import { Settings } from 'lucide-react';
import { ComingSoon } from '@/components/dashboard/coming-soon';

export const metadata: Metadata = {
  title: 'Paramètres | PeopleView',
};

export default function SettingsPage() {
  return (
    <ComingSoon
      title="Paramètres"
      description="Configurez votre organisation et votre compte."
      icon={Settings}
      features={[
        'Profil de l\'organisation',
        'Gestion de l\'abonnement et facturation',
        'Seuils d\'alerte personnalisés',
        'Gestion des utilisateurs et rôles',
      ]}
    />
  );
}

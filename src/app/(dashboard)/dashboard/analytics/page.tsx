import type { Metadata } from 'next';
import { BarChart3 } from 'lucide-react';
import { ComingSoon } from '@/components/dashboard/coming-soon';

export const metadata: Metadata = {
  title: 'Analytique | PeopleView',
};

export default function AnalyticsPage() {
  return (
    <ComingSoon
      title="Analytique"
      description="Analyses avancées et prédictives de vos données RH."
      icon={BarChart3}
      features={[
        'Score de risque d\'attrition par employé',
        'Détection d\'anomalies (paie, heures supp.)',
        'Suivi eNPS et engagement',
        'Analyse des écarts de compétences',
      ]}
    />
  );
}

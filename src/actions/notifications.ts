'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export type NotificationLevel = 'info' | 'warning' | 'error' | 'success';

export interface AppNotification {
  id: string;
  level: NotificationLevel;
  title: string;
  message: string;
  createdAt: string; // ISO string — safe to pass to client
}

export async function getNotifications(): Promise<AppNotification[]> {
  const session = await auth();
  if (!session?.user?.organizationId) return [];
  const orgId = session.user.organizationId;

  const notifications: AppNotification[] = [];

  const [subscription, employeeCount, highRiskCount, recentImports] = await Promise.all([
    prisma.subscription.findUnique({
      where: { organizationId: orgId },
      select: { status: true, plan: true, maxEmployees: true, stripeCurrentPeriodEnd: true },
    }),
    prisma.employee.count({ where: { organizationId: orgId, status: { not: 'TERMINATED' } } }),
    prisma.employee.count({ where: { organizationId: orgId, status: 'ACTIVE' } }), // proxy for analytics
    prisma.employee.count({
      where: {
        organizationId: orgId,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  // 1. Trial expiry warning
  if (subscription?.status === 'TRIALING' && subscription.stripeCurrentPeriodEnd) {
    const daysLeft = Math.ceil(
      (subscription.stripeCurrentPeriodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    if (daysLeft <= 7 && daysLeft >= 0) {
      notifications.push({
        id: 'trial-expiry',
        level: daysLeft <= 2 ? 'error' : 'warning',
        title: 'Période d\'essai',
        message:
          daysLeft === 0
            ? 'Votre période d\'essai se termine aujourd\'hui. Choisissez un plan pour continuer.'
            : `Votre période d'essai expire dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}. Pensez à choisir un plan.`,
        createdAt: new Date().toISOString(),
      });
    }
  }

  // 2. Subscription past due
  if (subscription?.status === 'PAST_DUE') {
    notifications.push({
      id: 'past-due',
      level: 'error',
      title: 'Paiement en retard',
      message: 'Votre abonnement présente un paiement en retard. Mettez à jour vos informations de paiement.',
      createdAt: new Date().toISOString(),
    });
  }

  // 3. Employee quota warning (≥80%)
  if (subscription && employeeCount >= subscription.maxEmployees * 0.8) {
    const pct = Math.round((employeeCount / subscription.maxEmployees) * 100);
    notifications.push({
      id: 'quota-warning',
      level: employeeCount >= subscription.maxEmployees ? 'error' : 'warning',
      title: 'Quota d\'employés',
      message:
        employeeCount >= subscription.maxEmployees
          ? `Limite atteinte (${employeeCount}/${subscription.maxEmployees}). Passez à un plan supérieur pour ajouter des collaborateurs.`
          : `Vous avez utilisé ${pct}% de votre quota (${employeeCount}/${subscription.maxEmployees} employés).`,
      createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    });
  }

  // 4. Recent imports
  if (recentImports > 0) {
    notifications.push({
      id: 'recent-import',
      level: 'success',
      title: 'Collaborateurs ajoutés',
      message: `${recentImports} collaborateur${recentImports > 1 ? 's ont été ajoutés' : ' a été ajouté'} au cours des 7 derniers jours.`,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    });
  }

  // 5. Attrition risk — we use a lightweight proxy: employees with >36 months tenure (peak churn window)
  const atRiskCount = await prisma.employee.count({
    where: {
      organizationId: orgId,
      status: 'ACTIVE',
      hireDate: {
        gte: new Date(Date.now() - 24 * 30 * 24 * 60 * 60 * 1000), // <24 months ago
        lte: new Date(Date.now() - 18 * 30 * 24 * 60 * 60 * 1000), // >18 months ago
      },
    },
  });
  if (atRiskCount > 0) {
    notifications.push({
      id: 'attrition-risk',
      level: atRiskCount >= 10 ? 'warning' : 'info',
      title: 'Risque d\'attrition',
      message: `${atRiskCount} employé${atRiskCount > 1 ? 's sont' : ' est'} dans la fenêtre critique d'ancienneté (18–24 mois). Consultez l'onglet Analytique.`,
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    });
  }

  // 6. Welcome if no other notifications
  if (notifications.length === 0) {
    notifications.push({
      id: 'welcome',
      level: 'info',
      title: 'Bienvenue sur PeopleView',
      message: 'Tout est en ordre. Vos données RH sont à jour et aucune alerte n\'est active.',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  return notifications;
}

import type { Metadata } from 'next';
import { Shield, Building2, Users, UserCheck } from 'lucide-react';
import { auth } from '@/lib/auth';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OrgAdminPanel } from '@/components/admin/org-admin-panel';
import { getOrgAdminData, getPlatformStats } from '@/actions/admin';

export const metadata: Metadata = {
  title: 'Administration | PeopleView',
};

const PLAN_LABELS: Record<string, string> = {
  STARTER: 'Starter',
  BUSINESS: 'Business',
  ENTERPRISE: 'Enterprise',
  '—': '—',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:text-emerald-400',
  TRIALING: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:text-amber-400',
  PAST_DUE: 'bg-red-500/10 text-red-600 border-red-200 dark:text-red-400',
  CANCELED: 'bg-slate-500/10 text-slate-600 border-slate-200 dark:text-slate-400',
  INCOMPLETE: 'bg-slate-500/10 text-slate-600 border-slate-200 dark:text-slate-400',
  '—': 'bg-slate-500/10 text-slate-600 border-slate-200 dark:text-slate-400',
};

export default async function AdminPage() {
  const session = await auth();
  const role = session?.user?.role;

  // ---------------------------------------------------------------------------
  // SUPER_ADMIN: Platform-wide view
  // ---------------------------------------------------------------------------
  if (role === 'SUPER_ADMIN') {
    let stats;
    try {
      stats = await getPlatformStats();
    } catch {
      return (
        <div className="flex flex-1 flex-col">
          <DashboardHeader title="Administration" />
          <div className="flex flex-1 items-center justify-center">
            <p className="text-muted-foreground">Données non disponibles.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-1 flex-col">
        <DashboardHeader
          title="Administration"
          breadcrumbs={[{ label: 'PeopleView', href: '/dashboard' }, { label: 'Administration' }]}
        />
        <div className="flex-1 space-y-6 p-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Plateforme</h1>
            <p className="text-muted-foreground">Vue d&apos;ensemble de toutes les organisations.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> Organisations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">{stats.totalOrgs}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" /> Utilisateurs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">{stats.totalUsers}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <UserCheck className="h-4 w-4" /> Employés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">{stats.totalEmployees}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Organisations</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="pb-3 text-left font-medium">Organisation</th>
                    <th className="pb-3 text-left font-medium">Slug</th>
                    <th className="pb-3 text-right font-medium">Utilisateurs</th>
                    <th className="pb-3 text-right font-medium">Employés</th>
                    <th className="pb-3 text-left font-medium">Plan</th>
                    <th className="pb-3 text-left font-medium">Statut</th>
                    <th className="pb-3 text-left font-medium">Créée le</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {stats.orgs.map((org) => (
                    <tr key={org.id} className="hover:bg-muted/30">
                      <td className="py-3 pr-4 font-medium">{org.name}</td>
                      <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">{org.slug}</td>
                      <td className="py-3 pr-4 text-right">{org.userCount}</td>
                      <td className="py-3 pr-4 text-right">{org.employeeCount}</td>
                      <td className="py-3 pr-4">{PLAN_LABELS[org.plan] ?? org.plan}</td>
                      <td className="py-3 pr-4">
                        <Badge variant="outline" className={`text-xs ${STATUS_COLORS[org.status] ?? ''}`}>
                          {org.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {new Date(org.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // ORG_ADMIN: Org management view
  // ---------------------------------------------------------------------------
  if (role === 'ORG_ADMIN') {
    let data;
    try {
      data = await getOrgAdminData();
    } catch {
      return (
        <div className="flex flex-1 flex-col">
          <DashboardHeader title="Administration" />
          <div className="flex flex-1 items-center justify-center">
            <p className="text-muted-foreground">Données non disponibles.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-1 flex-col">
        <DashboardHeader
          title="Administration"
          breadcrumbs={[{ label: 'PeopleView', href: '/dashboard' }, { label: 'Administration' }]}
        />
        <div className="flex-1 space-y-6 p-6 max-w-4xl">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Administration</h1>
            <p className="text-muted-foreground">
              Gestion des utilisateurs et supervision de votre organisation.
            </p>
          </div>
          <OrgAdminPanel data={data} />
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // EMPLOYEE or unauthenticated: Access denied
  // ---------------------------------------------------------------------------
  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader title="Administration" />
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto">
            <Shield className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Accès restreint</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Cette section est réservée aux administrateurs de l&apos;organisation.
              Contactez votre administrateur si vous pensez avoir besoin d&apos;accès.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

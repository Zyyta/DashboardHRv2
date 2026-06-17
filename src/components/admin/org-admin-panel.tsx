'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  Shield, Users, UserCheck, UserX, Trash2, Loader2,
  Building2, CreditCard, MoreVertical, Mail, Info,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { updateUserRole, removeOrgUser, type OrgAdminData, type OrgUser } from '@/actions/admin';

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ORG_ADMIN: 'Administrateur',
  EMPLOYEE: 'Employé',
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-500/10 text-red-600 border-red-200 dark:text-red-400',
  ORG_ADMIN: 'bg-violet-500/10 text-violet-600 border-violet-200 dark:text-violet-400',
  EMPLOYEE: 'bg-slate-500/10 text-slate-600 border-slate-200 dark:text-slate-400',
};

const PLAN_LABELS: Record<string, string> = {
  STARTER: 'Starter', BUSINESS: 'Business', ENTERPRISE: 'Enterprise',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Actif', TRIALING: "Période d'essai", PAST_DUE: 'Paiement en retard',
  CANCELED: 'Annulé', INCOMPLETE: 'Incomplet',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:text-emerald-400',
  TRIALING: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:text-amber-400',
  PAST_DUE: 'bg-red-500/10 text-red-600 border-red-200 dark:text-red-400',
  CANCELED: 'bg-slate-500/10 text-slate-600 border-slate-200 dark:text-slate-400',
  INCOMPLETE: 'bg-slate-500/10 text-slate-600 border-slate-200 dark:text-slate-400',
};

interface Props { data: OrgAdminData }

function UserRow({
  user,
  onRoleChange,
  onRemove,
  isPending,
}: {
  user: OrgUser;
  onRoleChange: (id: string, role: string) => void;
  onRemove: (user: OrgUser) => void;
  isPending: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b last:border-0 gap-4">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
          {(user.name ?? user.email).charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{user.name ?? '—'}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge variant="outline" className={`text-xs hidden sm:flex ${ROLE_COLORS[user.role] ?? ''}`}>
          {ROLE_LABELS[user.role] ?? user.role}
        </Badge>
        <span className="text-xs text-muted-foreground hidden md:block whitespace-nowrap">
          {new Date(user.createdAt).toLocaleDateString('fr-FR')}
        </span>

        {user.isSelf ? (
          <Badge variant="outline" className="text-xs text-muted-foreground">Vous</Badge>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isPending}>
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                Changer le rôle
              </div>
              <DropdownMenuItem
                onClick={() => onRoleChange(user.id, 'ORG_ADMIN')}
                disabled={user.role === 'ORG_ADMIN'}
                className="gap-2"
              >
                <UserCheck className="h-4 w-4 text-violet-500" />
                Administrateur
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onRoleChange(user.id, 'EMPLOYEE')}
                disabled={user.role === 'EMPLOYEE'}
                className="gap-2"
              >
                <UserX className="h-4 w-4 text-muted-foreground" />
                Employé
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 text-destructive focus:text-destructive"
                onClick={() => onRemove(user)}
              >
                <Trash2 className="h-4 w-4" />
                Supprimer le compte
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

export function OrgAdminPanel({ data }: Props) {
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<OrgUser | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');

  const usagePct = data.subscription
    ? Math.min(100, Math.round((data.employeeCount / data.subscription.maxEmployees) * 100))
    : 0;

  function handleRoleChange(userId: string, role: string) {
    startTransition(async () => {
      const result = await updateUserRole(userId, role as 'ORG_ADMIN' | 'EMPLOYEE');
      if (result.success) toast.success('Rôle mis à jour.');
      else toast.error(result.error);
    });
  }

  function handleRemoveConfirm() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await removeOrgUser(deleteTarget.id);
      if (result.success) toast.success('Compte supprimé.');
      else toast.error(result.error);
      setDeleteTarget(null);
    });
  }

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    toast.info('L\'invitation par email sera disponible prochainement.');
    setInviteEmail('');
  }

  return (
    <>
      <div className="space-y-6">

        {/* KPI row */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Organisation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold leading-tight">{data.orgName}</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {data.users.length} utilisateur{data.users.length > 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" /> Collaborateurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">{data.employeeCount}</p>
              {data.subscription && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  sur {data.subscription.maxEmployees} max
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Abonnement
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.subscription ? (
                <>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-bold">
                      {PLAN_LABELS[data.subscription.plan] ?? data.subscription.plan}
                    </p>
                    <Badge
                      variant="outline"
                      className={`text-xs ${STATUS_COLORS[data.subscription.status] ?? ''}`}
                    >
                      {STATUS_LABELS[data.subscription.status] ?? data.subscription.status}
                    </Badge>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">Aucun abonnement</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Usage bar */}
        {data.subscription && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Utilisation du quota</CardTitle>
                <span className={`text-sm font-semibold ${usagePct >= 100 ? 'text-red-500' : usagePct >= 80 ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {usagePct}%
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${usagePct >= 100 ? 'bg-red-500' : usagePct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${usagePct}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {data.employeeCount} employés actifs sur {data.subscription.maxEmployees} autorisés par votre plan {PLAN_LABELS[data.subscription.plan]}.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Users table */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-base">Utilisateurs PeopleView</CardTitle>
                <CardDescription>
                  Comptes ayant accès à votre espace PeopleView.
                </CardDescription>
              </div>
              <Badge variant="secondary" className="flex-shrink-0">
                {data.users.length} compte{data.users.length > 1 ? 's' : ''}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {data.users.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Aucun utilisateur.</p>
            ) : (
              <div>
                {data.users.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onRoleChange={handleRoleChange}
                    onRemove={setDeleteTarget}
                    isPending={isPending}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invite section */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              Inviter un collaborateur
            </CardTitle>
            <CardDescription>
              Donnez accès à PeopleView à un membre de votre équipe RH.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="flex gap-3">
              <div className="flex-1">
                <Label htmlFor="invite-email" className="sr-only">Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="colleague@company.fr"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={!inviteEmail.trim()}>
                Inviter
              </Button>
            </form>
            <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <span>
                L&apos;invitation par email sera disponible dans une prochaine mise à jour.
                L&apos;invité recevra un lien pour créer son compte avec accès à votre organisation.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Danger zone */}
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-base text-destructive flex items-center gap-2">
              <Shield className="h-4 w-4" /> Zone de danger
            </CardTitle>
            <CardDescription>Ces actions sont irréversibles.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-dashed p-3">
              <div>
                <p className="text-sm font-medium">Exporter toutes les données</p>
                <p className="text-xs text-muted-foreground">
                  Export CSV complet de tous les employés et données RH.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info('Export disponible prochainement.')}
              >
                Exporter
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-destructive/20 p-3">
              <div>
                <p className="text-sm font-medium text-destructive">Supprimer l&apos;organisation</p>
                <p className="text-xs text-muted-foreground">
                  Suppression définitive de toutes les données.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => toast.error('Contactez le support pour supprimer votre organisation.')}
              >
                Supprimer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Supprimer le compte de {deleteTarget?.name ?? deleteTarget?.email} ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L&apos;utilisateur perdra immédiatement l&apos;accès à PeopleView.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleRemoveConfirm(); }}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

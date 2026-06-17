'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Shield, Users, UserCheck, UserX, Trash2, Loader2, Building2, CreditCard } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  STARTER: 'Starter',
  BUSINESS: 'Business',
  ENTERPRISE: 'Enterprise',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Actif',
  TRIALING: "Période d'essai",
  PAST_DUE: 'Paiement en retard',
  CANCELED: 'Annulé',
  INCOMPLETE: 'Incomplet',
};

interface Props {
  data: OrgAdminData;
}

function UserRow({ user, onRoleChange, onRemove }: {
  user: OrgUser;
  onRoleChange: (id: string, role: string) => void;
  onRemove: (user: OrgUser) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-medium flex-shrink-0">
          {(user.name ?? user.email).charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{user.name ?? '—'}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <Badge variant="outline" className={`text-xs ${ROLE_COLORS[user.role] ?? ''}`}>
          {ROLE_LABELS[user.role] ?? user.role}
        </Badge>
        <p className="text-xs text-muted-foreground hidden sm:block">
          {new Date(user.createdAt).toLocaleDateString('fr-FR')}
        </p>

        {!user.isSelf && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <span className="sr-only">Actions</span>
                <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
                  <circle cx="8" cy="3" r="1.5" /><circle cx="8" cy="8" r="1.5" /><circle cx="8" cy="13" r="1.5" />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {user.role !== 'ORG_ADMIN' && (
                <DropdownMenuItem onClick={() => onRoleChange(user.id, 'ORG_ADMIN')}>
                  <UserCheck className="mr-2 h-4 w-4 text-violet-500" />
                  Promouvoir Administrateur
                </DropdownMenuItem>
              )}
              {user.role !== 'EMPLOYEE' && (
                <DropdownMenuItem onClick={() => onRoleChange(user.id, 'EMPLOYEE')}>
                  <UserX className="mr-2 h-4 w-4 text-muted-foreground" />
                  Rétrograder Employé
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onRemove(user)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer le compte
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {user.isSelf && (
          <Badge variant="outline" className="text-xs text-muted-foreground">Vous</Badge>
        )}
      </div>
    </div>
  );
}

export function OrgAdminPanel({ data }: Props) {
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<OrgUser | null>(null);

  function handleRoleChange(userId: string, role: string) {
    startTransition(async () => {
      const result = await updateUserRole(userId, role as 'ORG_ADMIN' | 'EMPLOYEE');
      if (result.success) {
        toast.success('Rôle mis à jour.');
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleRemoveConfirm() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await removeOrgUser(deleteTarget.id);
      if (result.success) {
        toast.success('Compte supprimé.');
        setDeleteTarget(null);
      } else {
        toast.error(result.error);
        setDeleteTarget(null);
      }
    });
  }

  const usagePct = data.subscription
    ? Math.min(100, Math.round((data.employeeCount / data.subscription.maxEmployees) * 100))
    : 0;

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
              <p className="text-xl font-bold">{data.orgName}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{data.users.length} utilisateur{data.users.length > 1 ? 's' : ''}</p>
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
                  sur {data.subscription.maxEmployees} maximum
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
                  <p className="text-xl font-bold">{PLAN_LABELS[data.subscription.plan] ?? data.subscription.plan}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {STATUS_LABELS[data.subscription.status] ?? data.subscription.status}
                  </p>
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
            <CardHeader>
              <CardTitle className="text-base">Utilisation du plan</CardTitle>
              <CardDescription>
                {data.employeeCount} / {data.subscription.maxEmployees} employés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${usagePct >= 100 ? 'bg-red-500' : usagePct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${usagePct}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{usagePct}% utilisé</p>
            </CardContent>
          </Card>
        )}

        {/* Users table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Utilisateurs de la plateforme</CardTitle>
                <CardDescription>
                  Comptes ayant accès à PeopleView pour votre organisation.
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-muted">
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
                  />
                ))}
              </div>
            )}

            <div className="mt-4 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 p-4 text-center">
              <p className="text-sm text-muted-foreground">
                L&apos;invitation de nouveaux utilisateurs sera disponible prochainement.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Danger zone */}
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-base text-destructive">Zone de danger</CardTitle>
            <CardDescription>
              Ces actions sont irréversibles. Procédez avec prudence.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-destructive/20 p-3">
              <div>
                <p className="text-sm font-medium">Exporter les données</p>
                <p className="text-xs text-muted-foreground">
                  Téléchargez toutes vos données RH au format CSV.
                </p>
              </div>
              <Button variant="outline" size="sm" disabled>Bientôt disponible</Button>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-destructive/20 p-3">
              <div>
                <p className="text-sm font-medium text-destructive">Supprimer l&apos;organisation</p>
                <p className="text-xs text-muted-foreground">
                  Supprime définitivement toutes les données de votre organisation.
                </p>
              </div>
              <Button variant="destructive" size="sm" disabled>Contacter le support</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le compte de {deleteTarget?.name ?? deleteTarget?.email} ?</AlertDialogTitle>
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

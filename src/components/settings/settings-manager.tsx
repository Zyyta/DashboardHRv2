'use client';

import { useState, useTransition } from 'react';
import { signOut } from 'next-auth/react';
import { toast } from 'sonner';
import { User, Building2, CreditCard, Lock, Check, Loader2, Eye, EyeOff, ShieldCheck, ShieldOff, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  updateUserProfile,
  updateOrgProfile,
  changePassword,
  type OrgSettings,
} from '@/actions/settings';
import {
  sendTwoFactorOtp,
  enableTwoFactor,
  disableTwoFactor,
  sendDeleteAccountOtp,
  deleteAccount,
} from '@/actions/auth-otp';

const PLAN_LABELS: Record<string, string> = {
  STARTER: 'Starter',
  BUSINESS: 'Business',
  ENTERPRISE: 'Enterprise',
};

const PLAN_COLORS: Record<string, string> = {
  STARTER: 'bg-blue-500/10 text-blue-600 border-blue-200 dark:text-blue-400',
  BUSINESS: 'bg-violet-500/10 text-violet-600 border-violet-200 dark:text-violet-400',
  ENTERPRISE: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:text-amber-400',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Actif',
  TRIALING: 'Période d\'essai',
  PAST_DUE: 'Paiement en retard',
  CANCELED: 'Annulé',
  INCOMPLETE: 'Incomplet',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:text-emerald-400',
  TRIALING: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:text-amber-400',
  PAST_DUE: 'bg-red-500/10 text-red-600 border-red-200 dark:text-red-400',
  CANCELED: 'bg-slate-500/10 text-slate-600 border-slate-200 dark:text-slate-400',
  INCOMPLETE: 'bg-slate-500/10 text-slate-600 border-slate-200 dark:text-slate-400',
};

interface Props {
  settings: OrgSettings;
}

// ---------------------------------------------------------------------------
// Account tab
// ---------------------------------------------------------------------------
function AccountTab({ user }: { user: OrgSettings['user'] }) {
  const [name, setName] = useState(user.name ?? '');
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const result = await updateUserProfile(name);
      if (result.success) {
        toast.success('Profil mis à jour.');
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations personnelles</CardTitle>
          <CardDescription>Votre nom d&apos;affichage dans PeopleView.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user-name">Nom complet</Label>
            <Input
              id="user-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Marie Dupont"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-email">Adresse email</Label>
            <Input
              id="user-email"
              value={user.email}
              disabled
              className="bg-muted text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground">
              L&apos;email est votre identifiant de connexion et ne peut pas être modifié ici.
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Enregistrer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Organisation tab
// ---------------------------------------------------------------------------
function OrgTab({ org }: { org: OrgSettings['org'] }) {
  const [name, setName] = useState(org.name);
  const [domain, setDomain] = useState(org.domain ?? '');
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const result = await updateOrgProfile({ name, domain });
      if (result.success) {
        toast.success('Organisation mise à jour.');
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profil de l&apos;organisation</CardTitle>
          <CardDescription>Informations visibles par tous les membres de votre organisation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">Nom de l&apos;organisation</Label>
            <Input
              id="org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="TechVision SAS"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-slug">Identifiant (slug)</Label>
            <Input
              id="org-slug"
              value={org.slug}
              disabled
              className="bg-muted text-muted-foreground font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              L&apos;identifiant est généré automatiquement et ne peut pas être modifié.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-domain">Domaine (optionnel)</Label>
            <Input
              id="org-domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="techvision.fr"
            />
            <p className="text-xs text-muted-foreground">
              Utilisé pour la détection automatique lors des invitations.
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Enregistrer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Subscription tab
// ---------------------------------------------------------------------------
function SubscriptionTab({ subscription }: { subscription: OrgSettings['subscription'] }) {
  if (!subscription) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Aucun abonnement associé à cette organisation.
        </CardContent>
      </Card>
    );
  }

  const usagePct = Math.min(100, Math.round((subscription.employeeCount / subscription.maxEmployees) * 100));
  const isNearLimit = usagePct >= 80;
  const atLimit = usagePct >= 100;

  const trialEnd = subscription.stripeCurrentPeriodEnd
    ? new Date(subscription.stripeCurrentPeriodEnd)
    : null;
  const daysLeft = trialEnd
    ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div className="space-y-6">
      {/* Plan overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plan actuel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{PLAN_LABELS[subscription.plan] ?? subscription.plan}</p>
                <p className="text-sm text-muted-foreground">
                  {subscription.maxEmployees} employés maximum
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <Badge variant="outline" className={PLAN_COLORS[subscription.plan] ?? ''}>
                {PLAN_LABELS[subscription.plan] ?? subscription.plan}
              </Badge>
              <Badge variant="outline" className={STATUS_COLORS[subscription.status] ?? ''}>
                {STATUS_LABELS[subscription.status] ?? subscription.status}
              </Badge>
            </div>
          </div>

          {daysLeft !== null && subscription.status === 'TRIALING' && (
            <div className={`rounded-lg border p-3 text-sm ${daysLeft <= 3 ? 'border-red-200 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400' : 'border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'}`}>
              {daysLeft === 0
                ? 'Votre période d\'essai se termine aujourd\'hui.'
                : `Votre période d'essai se termine dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}.`}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Utilisation</CardTitle>
          <CardDescription>Employés actifs par rapport à votre limite de plan.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Employés actifs</span>
            <span className={`font-semibold ${atLimit ? 'text-red-500' : isNearLimit ? 'text-amber-500' : ''}`}>
              {subscription.employeeCount} / {subscription.maxEmployees}
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${atLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${usagePct}%` }}
            />
          </div>
          {isNearLimit && (
            <p className={`text-xs ${atLimit ? 'text-red-500' : 'text-amber-600 dark:text-amber-400'}`}>
              {atLimit
                ? 'Limite atteinte. Passez à un plan supérieur pour ajouter des employés.'
                : `${subscription.maxEmployees - subscription.employeeCount} place${subscription.maxEmployees - subscription.employeeCount > 1 ? 's' : ''} restante${subscription.maxEmployees - subscription.employeeCount > 1 ? 's' : ''}.`}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Billing CTA */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">Gérer votre abonnement</p>
              <p className="text-sm text-muted-foreground">
                Plans, paiement, factures et résiliation depuis la page Facturation.
              </p>
            </div>
            <Button asChild>
              <Link href="/dashboard/billing">Voir la facturation →</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Security tab
// ---------------------------------------------------------------------------
function SecurityTab({ user }: { user: OrgSettings['user'] }) {
  // Change password
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [isPending, startTransition] = useTransition();

  // 2FA
  const [twoFaEnabled, setTwoFaEnabled] = useState(user.twoFactorEnabled);
  const [twoFaStep, setTwoFaStep] = useState<'idle' | 'confirm'>('idle');
  const [twoFaCode, setTwoFaCode] = useState('');
  const [twoFaLoading, setTwoFaLoading] = useState(false);

  // Delete account
  const [deleteStep, setDeleteStep] = useState<'idle' | 'confirm'>('idle');
  const [deleteCode, setDeleteCode] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  function handleChange() {
    const pwValid = next.length >= 8 && /[A-Z]/.test(next) && /[0-9]/.test(next);
    if (!pwValid) {
      toast.error('Le mot de passe ne respecte pas les critères de sécurité.');
      return;
    }
    if (next !== confirm) {
      toast.error('Les nouveaux mots de passe ne correspondent pas.');
      return;
    }
    startTransition(async () => {
      const result = await changePassword(current, next);
      if (result.success) {
        toast.success('Mot de passe modifié avec succès.');
        setCurrent('');
        setNext('');
        setConfirm('');
      } else {
        toast.error(result.error);
      }
    });
  }

  async function handleTwoFaToggle() {
    setTwoFaLoading(true);
    try {
      const result = await sendTwoFactorOtp();
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setTwoFaCode('');
      setTwoFaStep('confirm');
    } finally {
      setTwoFaLoading(false);
    }
  }

  async function handleTwoFaConfirm() {
    setTwoFaLoading(true);
    try {
      const result = twoFaEnabled
        ? await disableTwoFactor(twoFaCode)
        : await enableTwoFactor(twoFaCode);

      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setTwoFaEnabled(!twoFaEnabled);
      setTwoFaStep('idle');
      setTwoFaCode('');
      toast.success(twoFaEnabled ? '2FA désactivée.' : '2FA activée avec succès.');
    } finally {
      setTwoFaLoading(false);
    }
  }

  async function handleDeleteRequest() {
    setDeleteLoading(true);
    try {
      const result = await sendDeleteAccountOtp();
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setDeleteCode('');
      setDeleteStep('confirm');
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleDeleteConfirm() {
    setDeleteLoading(true);
    try {
      const result = await deleteAccount(deleteCode);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success('Compte supprimé.');
      await signOut({ callbackUrl: '/' });
    } finally {
      setDeleteLoading(false);
    }
  }

  const nextChecks = {
    length: next.length >= 8,
    uppercase: /[A-Z]/.test(next),
    number: /[0-9]/.test(next),
  };
  const nextValid = nextChecks.length && nextChecks.uppercase && nextChecks.number;

  return (
    <div className="space-y-6">
      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Changer le mot de passe</CardTitle>
          <CardDescription>Le nouveau mot de passe doit respecter les critères ci-dessous.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-pw">Mot de passe actuel</Label>
            <div className="relative">
              <Input
                id="current-pw"
                type={showCurrent ? 'text' : 'password'}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                placeholder="••••••••"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-pw">Nouveau mot de passe</Label>
            <div className="relative">
              <Input
                id="new-pw"
                type={showNext ? 'text' : 'password'}
                value={next}
                onChange={(e) => setNext(e.target.value)}
                placeholder="••••••••"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNext((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNext ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {next.length > 0 && (
              <div className="space-y-1">
                {[
                  { label: 'Au moins 8 caractères', ok: nextChecks.length },
                  { label: 'Une lettre majuscule', ok: nextChecks.uppercase },
                  { label: 'Un chiffre', ok: nextChecks.number },
                ].map(({ label, ok }) => (
                  <div key={label} className={`flex items-center gap-1.5 text-xs ${ok ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                    {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    {label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-pw">Confirmer le nouveau mot de passe</Label>
            <Input
              id="confirm-pw"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              className={confirm && confirm !== next ? 'border-red-400 focus-visible:ring-red-400' : ''}
            />
            {confirm && confirm !== next && (
              <p className="text-xs text-red-500">Les mots de passe ne correspondent pas.</p>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleChange}
              disabled={isPending || !current || !nextValid || next !== confirm}
            >
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
              Modifier le mot de passe
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Two-factor authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Authentification à deux facteurs
          </CardTitle>
          <CardDescription>
            {twoFaEnabled
              ? 'La 2FA est activée. Un code email vous sera demandé à chaque connexion.'
              : 'Ajoutez une couche de sécurité supplémentaire avec un code email à chaque connexion.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${twoFaEnabled ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
              <span className="text-sm font-medium">
                {twoFaEnabled ? 'Activée' : 'Désactivée'}
              </span>
            </div>
            {twoFaStep === 'idle' && (
              <Button
                variant={twoFaEnabled ? 'outline' : 'default'}
                size="sm"
                onClick={handleTwoFaToggle}
                disabled={twoFaLoading}
              >
                {twoFaLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : twoFaEnabled ? (
                  <ShieldOff className="mr-2 h-4 w-4" />
                ) : (
                  <ShieldCheck className="mr-2 h-4 w-4" />
                )}
                {twoFaEnabled ? 'Désactiver la 2FA' : 'Activer la 2FA'}
              </Button>
            )}
          </div>

          {twoFaStep === 'confirm' && (
            <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">
                Un code a été envoyé à <strong>{user.email}</strong>. Entrez-le pour{' '}
                {twoFaEnabled ? 'désactiver' : 'activer'} la 2FA.
              </p>
              <Input
                placeholder="123456"
                value={twoFaCode}
                onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center text-xl font-bold tracking-[0.4em]"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleTwoFaConfirm}
                  disabled={twoFaLoading || twoFaCode.length !== 6}
                >
                  {twoFaLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirmer
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setTwoFaStep('idle'); setTwoFaCode(''); }}
                  disabled={twoFaLoading}
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete account — danger zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base text-destructive flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Zone de danger
          </CardTitle>
          <CardDescription>
            La suppression de votre compte est définitive et irréversible.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {deleteStep === 'idle' ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteRequest}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Supprimer mon compte
            </Button>
          ) : (
            <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <p className="text-sm text-muted-foreground">
                Un code de confirmation a été envoyé à <strong>{user.email}</strong>.
                Cette action est <strong>irréversible</strong>.
              </p>
              <Input
                placeholder="123456"
                value={deleteCode}
                onChange={(e) => setDeleteCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center text-xl font-bold tracking-[0.4em] border-destructive/50"
              />
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteConfirm}
                  disabled={deleteLoading || deleteCode.length !== 6}
                >
                  {deleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirmer la suppression
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setDeleteStep('idle'); setDeleteCode(''); }}
                  disabled={deleteLoading}
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root export
// ---------------------------------------------------------------------------
export function SettingsManager({ settings }: Props) {
  return (
    <Tabs defaultValue="account" className="space-y-6">
      <TabsList className="h-auto flex-wrap gap-1">
        <TabsTrigger value="account" className="flex items-center gap-2">
          <User className="h-4 w-4" /> Mon compte
        </TabsTrigger>
        <TabsTrigger value="org" className="flex items-center gap-2">
          <Building2 className="h-4 w-4" /> Organisation
        </TabsTrigger>
        <TabsTrigger value="subscription" className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" /> Abonnement
        </TabsTrigger>
        <TabsTrigger value="security" className="flex items-center gap-2">
          <Lock className="h-4 w-4" /> Sécurité
        </TabsTrigger>
      </TabsList>

      <TabsContent value="account">
        <AccountTab user={settings.user} />
      </TabsContent>
      <TabsContent value="org">
        <OrgTab org={settings.org} />
      </TabsContent>
      <TabsContent value="subscription">
        <SubscriptionTab subscription={settings.subscription} />
      </TabsContent>
      <TabsContent value="security">
        <SecurityTab user={settings.user} />
      </TabsContent>
    </Tabs>
  );
}

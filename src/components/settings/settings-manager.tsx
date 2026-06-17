'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { User, Building2, CreditCard, Lock, Check, Loader2, Eye, EyeOff } from 'lucide-react';
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

      {/* Upgrade CTA */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">Passer à Business</p>
              <p className="text-sm text-muted-foreground">
                Jusqu&apos;à 500 employés, rapports avancés, accès API.
              </p>
            </div>
            <Button variant="outline" disabled>
              Bientôt disponible
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
function SecurityTab() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleChange() {
    if (next !== confirm) {
      toast.error('Les nouveaux mots de passe ne correspondent pas.');
      return;
    }
    if (next.length < 8) {
      toast.error('Le nouveau mot de passe doit contenir au moins 8 caractères.');
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

  const strength = next.length === 0 ? 0 : next.length < 8 ? 1 : next.length < 12 ? 2 : /[A-Z]/.test(next) && /[0-9]/.test(next) ? 4 : 3;
  const strengthLabels = ['', 'Faible', 'Moyen', 'Bon', 'Excellent'];
  const strengthColors = ['', 'bg-red-500', 'bg-amber-500', 'bg-blue-500', 'bg-emerald-500'];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Changer le mot de passe</CardTitle>
          <CardDescription>Utilisez un mot de passe fort d&apos;au moins 8 caractères.</CardDescription>
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
                <div className="flex gap-1 h-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-full transition-all ${i <= strength ? strengthColors[strength] : 'bg-muted'}`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{strengthLabels[strength]}</p>
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
              disabled={isPending || !current || !next || next !== confirm}
            >
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
              Modifier le mot de passe
            </Button>
          </div>
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
        <SecurityTab />
      </TabsContent>
    </Tabs>
  );
}

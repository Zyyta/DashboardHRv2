'use client';

import { useState, useTransition, useEffect } from 'react';
import { Check, CreditCard, Loader2, ExternalLink, Zap, Building2, Rocket } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PLANS } from '@/lib/stripe';
import {
  createCheckoutSession,
  createPortalSession,
  type BillingDetails,
  type BillingCycle,
} from '@/actions/billing';

// ─── Constants ────────────────────────────────────────────────────────────────

const PLAN_KEYS = ['STARTER', 'BUSINESS', 'ENTERPRISE'] as const;
type PlanKey = (typeof PLAN_KEYS)[number];

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Actif',
  TRIALING: "Période d'essai",
  PAST_DUE: 'Paiement en retard',
  CANCELED: 'Annulé',
  INCOMPLETE: 'Incomplet',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:text-emerald-400',
  TRIALING: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:text-amber-400',
  PAST_DUE: 'bg-red-500/10 text-red-600 border-red-200 dark:text-red-400',
  CANCELED: 'bg-slate-500/10 text-slate-500 border-slate-200',
  INCOMPLETE: 'bg-slate-500/10 text-slate-500 border-slate-200',
};

const PLAN_COLORS: Record<string, string> = {
  STARTER: 'bg-slate-500/10 text-slate-600 border-slate-200 dark:text-slate-400',
  BUSINESS: 'bg-violet-500/10 text-violet-600 border-violet-200 dark:text-violet-400',
  ENTERPRISE: 'bg-indigo-500/10 text-indigo-600 border-indigo-200 dark:text-indigo-400',
};

const PLAN_ICONS: Record<PlanKey, React.ElementType> = {
  STARTER: Zap,
  BUSINESS: Building2,
  ENTERPRISE: Rocket,
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  billing: BillingDetails;
  checkoutResult?: 'success' | 'canceled';
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BillingManager({ billing, checkoutResult }: Props) {
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [isPending, startTransition] = useTransition();
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);

  const { subscription, employeeCount, hasStripeCustomer } = billing;

  // Success/cancel toast after redirect
  useEffect(() => {
    if (checkoutResult === 'success') {
      toast.success('Abonnement activé ! Bienvenue sur PeopleView.', { duration: 6000 });
    } else if (checkoutResult === 'canceled') {
      toast.info('Paiement annulé. Aucune modification n\'a été effectuée.');
    }
  }, [checkoutResult]);

  // ── Status & usage ─────────────────────────────────────────────────────────

  const usagePct = subscription
    ? Math.min(100, Math.round((employeeCount / subscription.maxEmployees) * 100))
    : 0;

  const trialEnd = subscription?.stripeCurrentPeriodEnd
    ? new Date(subscription.stripeCurrentPeriodEnd)
    : null;

  const daysLeft = trialEnd
    ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const periodLabel =
    subscription?.status === 'TRIALING' && daysLeft !== null
      ? daysLeft === 0
        ? "Essai expiré aujourd'hui"
        : `Essai — ${daysLeft} jour${daysLeft !== 1 ? 's' : ''} restant${daysLeft !== 1 ? 's' : ''}`
      : trialEnd
      ? `Renouvellement le ${trialEnd.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`
      : null;

  // ── Actions ────────────────────────────────────────────────────────────────

  function handleCheckout(plan: PlanKey) {
    setPendingPlan(plan);
    startTransition(async () => {
      const result = await createCheckoutSession(plan, cycle);
      if ('error' in result) {
        toast.error(result.error);
        setPendingPlan(null);
      } else {
        window.location.href = result.url;
      }
    });
  }

  function handlePortal() {
    setPendingPlan('portal');
    startTransition(async () => {
      const result = await createPortalSession();
      if ('error' in result) {
        toast.error(result.error);
        setPendingPlan(null);
      } else {
        window.location.href = result.url;
      }
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  function getPlanButton(planKey: PlanKey) {
    const isCurrentPlan = subscription?.plan === planKey;
    const isActive = subscription?.status === 'ACTIVE';
    const loading = isPending && pendingPlan === planKey;

    if (isCurrentPlan && isActive) {
      return (
        <Button variant="outline" disabled className="w-full">
          Plan actuel
        </Button>
      );
    }

    // Active subscriber on a different plan → portal for plan change
    if (isActive && hasStripeCustomer) {
      return (
        <Button
          variant="outline"
          className="w-full"
          disabled={isPending}
          onClick={handlePortal}
        >
          {isPending && pendingPlan === 'portal' ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ExternalLink className="mr-2 h-4 w-4" />
          )}
          Changer via le portail
        </Button>
      );
    }

    // Trial or canceled → checkout
    return (
      <Button
        className={`w-full ${planKey === 'BUSINESS' ? '' : ''}`}
        variant={planKey === 'BUSINESS' ? 'default' : 'outline'}
        disabled={isPending}
        onClick={() => handleCheckout(planKey)}
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        Choisir ce plan
      </Button>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">

      {/* ── Section 1 : Statut actuel ─────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Plan card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Abonnement actuel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {subscription ? (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold">
                    {PLANS[subscription.plan as PlanKey]?.name ?? subscription.plan}
                  </p>
                  <div className="flex flex-col items-end gap-1.5">
                    <Badge variant="outline" className={`text-xs ${PLAN_COLORS[subscription.plan] ?? ''}`}>
                      {PLANS[subscription.plan as PlanKey]?.name ?? subscription.plan}
                    </Badge>
                    <Badge variant="outline" className={`text-xs ${STATUS_COLORS[subscription.status] ?? ''}`}>
                      {STATUS_LABELS[subscription.status] ?? subscription.status}
                    </Badge>
                  </div>
                </div>

                {periodLabel && (
                  <p className={`text-xs ${
                    subscription.status === 'TRIALING' && daysLeft !== null && daysLeft <= 3
                      ? 'text-red-500'
                      : 'text-muted-foreground'
                  }`}>
                    {periodLabel}
                  </p>
                )}

                {subscription.status === 'PAST_DUE' && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-400">
                    Paiement en retard. Mettez à jour votre moyen de paiement pour éviter l&apos;interruption du service.
                  </div>
                )}

                {subscription.status === 'CANCELED' && (
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-slate-950/30">
                    Abonnement annulé. Choisissez un plan pour réactiver votre accès.
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun abonnement actif.</p>
            )}
          </CardContent>
        </Card>

        {/* Usage card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Utilisation du quota
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Employés actifs</span>
              <span className={`font-bold ${
                usagePct >= 100 ? 'text-red-500' : usagePct >= 80 ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {employeeCount} / {subscription?.maxEmployees ?? '—'}
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${
                  usagePct >= 100 ? 'bg-red-500' : usagePct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${usagePct}%` }}
              />
            </div>
            {usagePct >= 80 && (
              <p className={`text-xs ${usagePct >= 100 ? 'text-red-500' : 'text-amber-600 dark:text-amber-400'}`}>
                {usagePct >= 100
                  ? 'Limite atteinte — passez à un plan supérieur pour ajouter des employés.'
                  : `${(subscription?.maxEmployees ?? 0) - employeeCount} place${(subscription?.maxEmployees ?? 0) - employeeCount !== 1 ? 's' : ''} restante${(subscription?.maxEmployees ?? 0) - employeeCount !== 1 ? 's' : ''}.`}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Section 2 : Bouton Portail ────────────────────────────── */}
      {hasStripeCustomer && (
        <Card className="border-dashed">
          <CardContent className="pt-5 pb-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">Portail de facturation Stripe</p>
                <p className="text-sm text-muted-foreground">
                  Modifiez votre moyen de paiement, consultez vos factures ou résiliez votre abonnement.
                </p>
              </div>
              <Button
                variant="outline"
                className="flex-shrink-0 gap-2"
                disabled={isPending}
                onClick={handlePortal}
              >
                {isPending && pendingPlan === 'portal' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                Gérer l&apos;abonnement
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Section 3 : Sélecteur de plan ────────────────────────── */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Choisir un plan</h2>
            <p className="text-sm text-muted-foreground">Sans engagement. Annulation à tout moment.</p>
          </div>

          {/* Monthly / Yearly toggle */}
          <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1 text-sm">
            <button
              onClick={() => setCycle('monthly')}
              className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                cycle === 'monthly'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setCycle('yearly')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors ${
                cycle === 'yearly'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Annuel
              <Badge variant="secondary" className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900 dark:text-emerald-300">
                −17%
              </Badge>
            </button>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {PLAN_KEYS.map((planKey) => {
            const plan = PLANS[planKey];
            const Icon = PLAN_ICONS[planKey];
            const isCurrentPlan = subscription?.plan === planKey;
            const isRecommended = planKey === 'BUSINESS';
            const monthlyEquiv =
              cycle === 'yearly'
                ? Math.round(plan.yearlyPrice / 12)
                : plan.monthlyPrice;

            return (
              <Card
                key={planKey}
                className={`relative flex flex-col ${
                  isRecommended
                    ? 'border-primary shadow-md'
                    : isCurrentPlan
                    ? 'border-muted-foreground/30'
                    : ''
                }`}
              >
                {isRecommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground shadow-sm text-xs">
                      Recommandé
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        isRecommended ? 'bg-primary/10' : 'bg-muted'
                      }`}>
                        <Icon className={`h-4 w-4 ${isRecommended ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <CardTitle className="text-base">{plan.name}</CardTitle>
                    </div>
                    {isCurrentPlan && (
                      <Badge variant="outline" className={`text-xs ${PLAN_COLORS[planKey]}`}>
                        Actuel
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs">{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col gap-4">
                  {/* Price */}
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">{monthlyEquiv} €</span>
                      <span className="text-sm text-muted-foreground">/mois</span>
                    </div>
                    {cycle === 'yearly' && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Soit {plan.yearlyPrice} € facturé annuellement
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="flex-1 space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <div className="mt-2">{getPlanButton(planKey)}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Paiement sécurisé par Stripe · Annulation sans frais · TVA en sus selon pays
        </p>
      </div>

      {/* ── FAQ / Help ────────────────────────────────────────────── */}
      <div className="rounded-lg border bg-muted/20 px-5 py-4">
        <p className="text-sm font-medium">Besoin d&apos;aide ?</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Pour toute question sur votre facturation, contactez{' '}
          <Link href="mailto:support@peopleview.fr" className="underline underline-offset-2">
            support@peopleview.fr
          </Link>
          . Le portail Stripe vous permet de télécharger vos factures et de modifier votre
          moyen de paiement à tout moment.
        </p>
      </div>
    </div>
  );
}

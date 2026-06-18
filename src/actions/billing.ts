'use server';

import { prisma } from '@/lib/prisma';
import { stripe, PLANS } from '@/lib/stripe';
import { getOrgId, getOrgUser } from '@/lib/session';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BillingDetails {
  subscription: {
    plan: string;
    status: string;
    maxEmployees: number;
    stripeCurrentPeriodEnd: Date | null;
    stripeSubscriptionId: string | null;
  } | null;
  employeeCount: number;
  hasStripeCustomer: boolean;
}

export type BillingCycle = 'monthly' | 'yearly';

// ─── Server Actions ───────────────────────────────────────────────────────────

export async function getBillingDetails(): Promise<BillingDetails> {
  const orgId = await getOrgId();

  const [org, subscription, employeeCount] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: orgId },
      select: { stripeCustomerId: true },
    }),
    prisma.subscription.findUnique({
      where: { organizationId: orgId },
      select: {
        plan: true,
        status: true,
        maxEmployees: true,
        stripeCurrentPeriodEnd: true,
        stripeSubscriptionId: true,
      },
    }),
    prisma.employee.count({
      where: { organizationId: orgId, status: { not: 'TERMINATED' } },
    }),
  ]);

  return {
    subscription: subscription
      ? {
          plan: subscription.plan,
          status: subscription.status,
          maxEmployees: subscription.maxEmployees,
          stripeCurrentPeriodEnd: subscription.stripeCurrentPeriodEnd,
          stripeSubscriptionId: subscription.stripeSubscriptionId,
        }
      : null,
    employeeCount,
    hasStripeCustomer: !!org?.stripeCustomerId,
  };
}

export async function createCheckoutSession(
  plan: keyof typeof PLANS,
  cycle: BillingCycle
): Promise<{ url: string } | { error: string }> {
  try {
    const orgUser = await getOrgUser();
    if (orgUser.role === 'EMPLOYEE') return { error: 'Non autorisé.' };
    const orgId = orgUser.organizationId;

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, name: true, stripeCustomerId: true },
    });

    if (!org) return { error: 'Organisation introuvable.' };

    // Create or reuse Stripe customer
    let customerId = org.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: orgUser.email ?? undefined,
        name: org.name,
        metadata: { organizationId: orgId },
      });
      await prisma.organization.update({
        where: { id: orgId },
        data: { stripeCustomerId: customer.id },
      });
      customerId = customer.id;
    }

    const planConfig = PLANS[plan];
    const priceId = planConfig.prices[cycle];

    if (!priceId) {
      return { error: `Price ID manquant pour le plan ${plan} (${cycle}). Vérifiez vos variables d'environnement.` };
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${APP_URL}/dashboard/billing?checkout=success`,
      cancel_url: `${APP_URL}/dashboard/billing`,
      metadata: { organizationId: orgId, plan, cycle },
      subscription_data: {
        metadata: { organizationId: orgId },
      },
      allow_promotion_codes: true,
    });

    if (!checkoutSession.url) return { error: 'Impossible de créer la session de paiement.' };

    return { url: checkoutSession.url };
  } catch (err) {
    console.error('createCheckoutSession error:', err);
    return { error: "Erreur lors de la création de la session de paiement. Vérifiez votre configuration Stripe." };
  }
}

export async function createPortalSession(): Promise<{ url: string } | { error: string }> {
  try {
    const orgUser = await getOrgUser();
    if (orgUser.role === 'EMPLOYEE') return { error: 'Non autorisé.' };
    const orgId = orgUser.organizationId;

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { stripeCustomerId: true },
    });

    if (!org?.stripeCustomerId) {
      return {
        error: "Aucun abonnement Stripe actif. Choisissez d'abord un plan pour accéder au portail.",
      };
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: org.stripeCustomerId,
      return_url: `${APP_URL}/dashboard/billing`,
    });

    return { url: portalSession.url };
  } catch (err) {
    console.error('createPortalSession error:', err);
    return { error: 'Erreur lors de l\'ouverture du portail de facturation.' };
  }
}

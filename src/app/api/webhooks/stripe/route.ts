// =============================================================================
// Stripe Webhook Handler
// Processes subscription events and syncs to database
// =============================================================================

import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import type { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import Stripe from 'stripe';

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        // Explicitly sync subscription status to ACTIVE when a payment succeeds.
        // Stripe also fires customer.subscription.updated for this transition,
        // but handling it here too ensures we recover from PAST_DUE immediately.
        if (invoice.subscription && typeof invoice.subscription === 'string') {
          const stripeSub = await stripe.subscriptions.retrieve(invoice.subscription);
          await handleSubscriptionUpdate(stripeSub);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription && typeof invoice.subscription === 'string') {
          await prisma.subscription.updateMany({
            where: { stripeSubscriptionId: invoice.subscription },
            data: { status: 'PAST_DUE' },
          });
          console.warn(`[webhook] Payment failed — subscription ${invoice.subscription} marked PAST_DUE`);
        }
        break;
      }

      default:
        // Unhandled event type — not an error
        break;
    }
  } catch (err) {
    console.error('Error processing webhook event:', event.type, err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapStripePlan(priceId: string): SubscriptionPlan {
  const priceMap: Record<string, SubscriptionPlan> = {
    [process.env.STRIPE_STARTER_MONTHLY_PRICE_ID ?? '']: 'STARTER',
    [process.env.STRIPE_STARTER_YEARLY_PRICE_ID ?? '']: 'STARTER',
    [process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID ?? '']: 'BUSINESS',
    [process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID ?? '']: 'BUSINESS',
    [process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID ?? '']: 'ENTERPRISE',
    [process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID ?? '']: 'ENTERPRISE',
  };
  // Empty string key must never match a real priceId
  const plan = priceMap[priceId];
  if (!plan || priceId === '') {
    console.warn(`[webhook] Unknown priceId "${priceId}" — defaulting to STARTER`);
    return 'STARTER';
  }
  return plan;
}

function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  const statusMap: Record<string, SubscriptionStatus> = {
    active: 'ACTIVE',
    past_due: 'PAST_DUE',
    canceled: 'CANCELED',
    trialing: 'TRIALING',
    incomplete: 'INCOMPLETE',
    incomplete_expired: 'CANCELED',
    unpaid: 'PAST_DUE',
    paused: 'PAST_DUE',
  };
  return statusMap[status] ?? 'INCOMPLETE';
}

function maxEmployeesForPlan(plan: SubscriptionPlan): number {
  switch (plan) {
    case 'STARTER': return 25;
    case 'BUSINESS': return 100;
    case 'ENTERPRISE': return 999999;
    default: return 25;
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0]?.price?.id;

  if (!priceId) {
    console.error('[webhook] No priceId on subscription', subscription.id);
    return;
  }

  const plan = mapStripePlan(priceId);
  const status = mapStripeStatus(subscription.status);

  const org = await prisma.organization.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!org) {
    console.error(`[webhook] No organization found for Stripe customer ${customerId}`);
    return;
  }

  await prisma.subscription.upsert({
    where: { organizationId: org.id },
    create: {
      organizationId: org.id,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      plan,
      status,
      maxEmployees: maxEmployeesForPlan(plan),
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
    update: {
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      plan,
      status,
      maxEmployees: maxEmployeesForPlan(plan),
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });

  console.log(`[webhook] Subscription updated: org=${org.id} plan=${plan} status=${status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const org = await prisma.organization.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!org) return;

  await prisma.subscription.update({
    where: { organizationId: org.id },
    data: {
      status: 'CANCELED',
      stripeSubscriptionId: null,
      stripePriceId: null,
      stripeCurrentPeriodEnd: null,
    },
  });

  console.log(`[webhook] Subscription deleted: org=${org.id}`);
}

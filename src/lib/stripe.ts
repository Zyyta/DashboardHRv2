// =============================================================================
// Stripe Client Configuration
// =============================================================================

import Stripe from 'stripe';

// Lazy-initialized singleton: the Stripe client is only constructed the first
// time it is actually used (at runtime), not when this module is imported.
// This prevents `next build` from crashing during page-data collection when
// STRIPE_SECRET_KEY is not available in the build environment.
let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured.');
    }
    stripeInstance = new Stripe(apiKey, {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
    });
  }
  return stripeInstance;
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const client = getStripe();
    const value = client[prop as keyof Stripe];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

// Subscription plan configuration
export const PLANS = {
  STARTER: {
    name: 'Starter',
    description: "Jusqu'à 25 employés",
    maxEmployees: 25,
    prices: {
      monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID!,
      yearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID!,
    },
    features: [
      'Dashboard analytique complet',
      "Jusqu'à 25 employés",
      'Export CSV',
      'Support par email',
    ],
    monthlyPrice: 29,
    yearlyPrice: 290,
  },
  BUSINESS: {
    name: 'Business',
    description: "Jusqu'à 100 employés",
    maxEmployees: 100,
    prices: {
      monthly: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID!,
      yearly: process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID!,
    },
    features: [
      'Toutes les fonctionnalités Starter',
      "Jusqu'à 100 employés",
      'Export PDF & CSV',
      'Rapports avancés',
      'Support prioritaire',
    ],
    monthlyPrice: 79,
    yearlyPrice: 790,
  },
  ENTERPRISE: {
    name: 'Enterprise',
    description: 'Employés illimités',
    maxEmployees: Infinity,
    prices: {
      monthly: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID!,
      yearly: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID!,
    },
    features: [
      'Toutes les fonctionnalités Business',
      'Employés illimités',
      'API dédiée',
      'SSO / SAML',
      'Account Manager dédié',
      'SLA garanti',
    ],
    monthlyPrice: 199,
    yearlyPrice: 1990,
  },
} as const;

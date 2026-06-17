// =============================================================================
// PeopleView — Landing Page Marketing
// =============================================================================

import Link from 'next/link';
import {
  BarChart3,
  Users,
  Shield,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navigation */}
      <nav className="border-b border-white/5 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">PeopleView</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Connexion
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-sm font-medium hover:from-indigo-600 hover:to-violet-700 transition-all"
            >
              Essai gratuit
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-indigo-500/15 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-violet-500/15 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-pink-500/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-24 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-300">
              <Sparkles className="h-4 w-4" />
              Nouveau — Analyse de parité salariale
            </div>

            <h1 className="mb-6 text-5xl font-bold tracking-tight lg:text-7xl">
              <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Le tableau de bord RH
              </span>
              <br />
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                qui transforme vos données
              </span>
            </h1>

            <p className="mb-10 text-lg text-slate-400 lg:text-xl">
              PeopleView centralise vos indicateurs RH en temps réel.
              Turnover, absentéisme, diversité, parité salariale — prenez des
              décisions éclairées grâce à des visualisations puissantes.
            </p>

            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/login"
                className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-8 py-3.5 font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all"
              >
                Accéder au Dashboard
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="#features"
                className="rounded-xl border border-white/10 bg-white/5 px-8 py-3.5 font-semibold backdrop-blur-sm hover:bg-white/10 transition-all"
              >
                Découvrir les features
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-white/5 bg-slate-950/50">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold lg:text-4xl">
              Tout ce dont vous avez besoin pour piloter vos RH
            </h2>
            <p className="text-slate-400 lg:text-lg">
              Des indicateurs clés aux analyses approfondies, PeopleView couvre
              l&apos;ensemble de vos besoins analytiques RH.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Users,
                title: 'Gestion des Effectifs',
                description:
                  "Suivez l'évolution de vos effectifs, les embauches et départs par département en temps réel.",
                color: 'from-blue-500 to-cyan-500',
              },
              {
                icon: TrendingUp,
                title: 'Rétention & Turnover',
                description:
                  "Analysez votre taux de turnover, identifiez les motifs de départ et l'ancienneté moyenne.",
                color: 'from-indigo-500 to-violet-500',
              },
              {
                icon: BarChart3,
                title: 'Absentéisme',
                description:
                  "Visualisez les tendances d'absentéisme, les congés restants vs pris par équipe.",
                color: 'from-violet-500 to-pink-500',
              },
              {
                icon: Shield,
                title: 'Diversité & Équité',
                description:
                  'Pyramide des âges, répartition H/F, parité salariale — pilotez votre politique D&I.',
                color: 'from-pink-500 to-rose-500',
              },
              {
                icon: CheckCircle2,
                title: 'Export & Rapports',
                description:
                  'Exportez vos données en PDF ou CSV. Générez des rapports personnalisés en un clic.',
                color: 'from-amber-500 to-orange-500',
              },
              {
                icon: Sparkles,
                title: 'Multi-tenant SaaS',
                description:
                  'Architecture sécurisée avec isolation des données. Chaque entreprise a son espace dédié.',
                color: 'from-emerald-500 to-teal-500',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group rounded-2xl border border-white/5 bg-white/[0.02] p-8 backdrop-blur-sm hover:border-white/10 hover:bg-white/[0.04] transition-all duration-300"
              >
                <div
                  className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} shadow-lg`}
                >
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-white/5">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold lg:text-4xl">
              Tarification simple et transparente
            </h2>
            <p className="text-slate-400 lg:text-lg">
              Choisissez le plan adapté à la taille de votre entreprise.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                name: 'Starter',
                price: '29',
                description: "Jusqu'à 25 employés",
                features: [
                  'Dashboard complet',
                  '7 graphiques interactifs',
                  'Export CSV',
                  'Support email',
                ],
                highlight: false,
              },
              {
                name: 'Business',
                price: '79',
                description: "Jusqu'à 100 employés",
                features: [
                  'Tout de Starter',
                  'Export PDF & CSV',
                  'Rapports avancés',
                  'Support prioritaire',
                  'API accès',
                ],
                highlight: true,
              },
              {
                name: 'Enterprise',
                price: '199',
                description: 'Employés illimités',
                features: [
                  'Tout de Business',
                  'SSO / SAML',
                  'Account Manager',
                  'SLA garanti',
                  'Personnalisation',
                  'On-premise possible',
                ],
                highlight: false,
              },
            ].map((plan, i) => (
              <div
                key={i}
                className={`relative rounded-2xl border p-8 ${
                  plan.highlight
                    ? 'border-indigo-500/50 bg-gradient-to-b from-indigo-500/10 to-transparent shadow-lg shadow-indigo-500/10'
                    : 'border-white/5 bg-white/[0.02]'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-1 text-xs font-medium">
                    Le plus populaire
                  </div>
                )}
                <h3 className="mb-1 text-lg font-semibold">{plan.name}</h3>
                <p className="mb-4 text-sm text-slate-400">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}€</span>
                  <span className="text-slate-400">/mois</span>
                </div>
                <ul className="mb-8 space-y-3">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-slate-300">
                      <CheckCircle2 className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`block w-full rounded-lg py-2.5 text-center text-sm font-medium transition-all ${
                    plan.highlight
                      ? 'bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700'
                      : 'border border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  Commencer l&apos;essai gratuit
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-slate-950">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold">PeopleView</span>
            </div>
            <p className="text-sm text-slate-500">
              © 2026 PeopleView. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

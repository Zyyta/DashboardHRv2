'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Route } from 'next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart3, Loader2, Eye, EyeOff, CheckCircle2, Building2, Users, Check, X } from 'lucide-react';

type Flow = 'create' | 'join';

function PasswordRequirements({ password }: { password: string }) {
  const checks = [
    { label: 'Au moins 8 caractères', ok: password.length >= 8 },
    { label: 'Une lettre majuscule', ok: /[A-Z]/.test(password) },
    { label: 'Un chiffre', ok: /[0-9]/.test(password) },
  ];
  return (
    <div className="space-y-1">
      {checks.map(({ label, ok }) => (
        <div key={label} className={`flex items-center gap-1.5 text-xs ${ok ? 'text-emerald-400' : 'text-slate-500'}`}>
          {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          {label}
        </div>
      ))}
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [flow, setFlow] = useState<Flow>('create');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    inviteCode: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const passwordValid =
    form.password.length >= 8 && /[A-Z]/.test(form.password) && /[0-9]/.test(form.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!passwordValid) {
      setError('Le mot de passe ne respecte pas les critères de sécurité.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);

    try {
      const payload =
        flow === 'create'
          ? { name: form.name, email: form.email, password: form.password, companyName: form.companyName }
          : { name: form.name, email: form.email, password: form.password, inviteCode: form.inviteCode };

      const res = await fetch(`/api/auth/register?flow=${flow}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Une erreur est survenue.');
        return;
      }

      router.push(`/verify-email?email=${encodeURIComponent(form.email)}` as Route);
    } catch {
      setError('Une erreur réseau est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const createPerks = [
    "14 jours d'essai gratuit",
    'Aucune carte bancaire requise',
    'Tableau de bord RH complet',
    "Code d'invitation généré automatiquement",
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        <Card className="border-white/10 bg-slate-900/80 backdrop-blur-xl">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25">
              <BarChart3 className="h-7 w-7 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-white">
                Créer un compte PeopleView
              </CardTitle>
              <CardDescription className="text-slate-400">
                Rejoignez votre équipe ou créez votre espace
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Flow toggle */}
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
              <button
                type="button"
                onClick={() => { setFlow('create'); setError(''); }}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  flow === 'create'
                    ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Building2 className="h-4 w-4" />
                Créer une organisation
              </button>
              <button
                type="button"
                onClick={() => { setFlow('join'); setError(''); }}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  flow === 'join'
                    ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="h-4 w-4" />
                Rejoindre une organisation
              </button>
            </div>

            {flow === 'create' && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  {createPerks.map((perk) => (
                    <div key={perk} className="flex items-center gap-2 text-xs text-slate-400">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                      {perk}
                    </div>
                  ))}
                </div>
                <div className="border-t border-white/10" />
              </>
            )}

            {flow === 'join' && (
              <>
                <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-300">
                  Votre administrateur RH vous a fourni un code d&apos;invitation.
                  Entrez-le ci-dessous pour rejoindre votre espace PeopleView.
                </div>
                <div className="border-t border-white/10" />
              </>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className={flow === 'create' ? 'grid grid-cols-2 gap-4' : ''}>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-300">Nom complet</Label>
                  <Input
                    id="name"
                    placeholder="Marie Dupont"
                    value={form.name}
                    onChange={update('name')}
                    required
                    className="border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:border-indigo-500"
                  />
                </div>

                {flow === 'create' && (
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-slate-300">Nom de l&apos;entreprise</Label>
                    <Input
                      id="companyName"
                      placeholder="TechVision SAS"
                      value={form.companyName}
                      onChange={update('companyName')}
                      required
                      className="border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email professionnel</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="marie@entreprise.fr"
                  value={form.email}
                  onChange={update('email')}
                  required
                  className="border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:border-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={update('password')}
                    required
                    className="border-white/10 bg-white/5 pr-10 text-white placeholder:text-slate-500 focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.password.length > 0 && (
                  <PasswordRequirements password={form.password} />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-300">Confirmer le mot de passe</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.confirmPassword}
                    onChange={update('confirmPassword')}
                    required
                    className={`border-white/10 bg-white/5 pr-10 text-white placeholder:text-slate-500 focus:border-indigo-500 ${
                      form.confirmPassword && form.confirmPassword !== form.password
                        ? 'border-red-500/50'
                        : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.confirmPassword && form.confirmPassword !== form.password && (
                  <p className="text-xs text-red-400">Les mots de passe ne correspondent pas.</p>
                )}
              </div>

              {flow === 'join' && (
                <div className="space-y-2">
                  <Label htmlFor="inviteCode" className="text-slate-300">Code d&apos;invitation</Label>
                  <Input
                    id="inviteCode"
                    placeholder="Code fourni par votre administrateur"
                    value={form.inviteCode}
                    onChange={update('inviteCode')}
                    required
                    className="border-white/10 bg-white/5 font-mono text-white placeholder:text-slate-500 focus:border-indigo-500"
                  />
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 font-semibold text-white hover:from-indigo-600 hover:to-violet-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création en cours…
                  </>
                ) : flow === 'create' ? (
                  "Démarrer l'essai gratuit"
                ) : (
                  'Rejoindre mon équipe'
                )}
              </Button>

              {flow === 'create' && (
                <p className="text-center text-xs text-slate-500">
                  En créant un compte, vous acceptez nos{' '}
                  <span className="text-slate-400">Conditions d&apos;utilisation</span>
                  {' '}et notre{' '}
                  <span className="text-slate-400">Politique de confidentialité</span>.
                </p>
              )}
            </form>

            <div className="border-t border-white/10 pt-4">
              <p className="text-center text-sm text-slate-400">
                Déjà un compte ?{' '}
                <Link href="/login" className="font-medium text-indigo-400 hover:text-indigo-300">
                  Se connecter
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

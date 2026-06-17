'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart3, Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    companyName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Une erreur est survenue.');
        return;
      }

      // Auto sign-in after registration
      const result = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Compte créé mais connexion échouée. Veuillez vous connecter manuellement.');
        router.push('/login');
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Une erreur réseau est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const perks = [
    '14 jours d\'essai gratuit',
    'Aucune carte bancaire requise',
    'Tableau de bord RH complet',
    'Données supprimées à la fin de l\'essai',
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
                Créer votre espace PeopleView
              </CardTitle>
              <CardDescription className="text-slate-400">
                Essai gratuit 14 jours — sans engagement
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Perks */}
            <div className="grid grid-cols-2 gap-2">
              {perks.map((perk) => (
                <div key={perk} className="flex items-center gap-2 text-xs text-slate-400">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  {perk}
                </div>
              ))}
            </div>

            <div className="border-t border-white/10" />

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-300">
                    Nom complet
                  </Label>
                  <Input
                    id="name"
                    placeholder="Marie Dupont"
                    value={form.name}
                    onChange={update('name')}
                    required
                    className="border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-slate-300">
                    Nom de l&apos;entreprise
                  </Label>
                  <Input
                    id="companyName"
                    placeholder="TechVision SAS"
                    value={form.companyName}
                    onChange={update('companyName')}
                    required
                    className="border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">
                  Email professionnel
                </Label>
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
                <Label htmlFor="password" className="text-slate-300">
                  Mot de passe
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="8 caractères minimum"
                    value={form.password}
                    onChange={update('password')}
                    required
                    minLength={8}
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
                {form.password.length > 0 && form.password.length < 8 && (
                  <p className="text-xs text-amber-400">
                    {8 - form.password.length} caractère{8 - form.password.length > 1 ? 's' : ''} manquant{8 - form.password.length > 1 ? 's' : ''}
                  </p>
                )}
              </div>

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
                ) : (
                  'Démarrer l\'essai gratuit'
                )}
              </Button>

              <p className="text-center text-xs text-slate-500">
                En créant un compte, vous acceptez nos{' '}
                <span className="text-slate-400">Conditions d&apos;utilisation</span>
                {' '}et notre{' '}
                <span className="text-slate-400">Politique de confidentialité</span>.
              </p>
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

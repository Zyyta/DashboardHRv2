'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Route } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart3, Loader2, Eye, EyeOff, CheckCircle2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { initiateLogin } from '@/actions/auth-otp';

type Step = 'credentials' | 'otp';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verified = searchParams.get('verified') === '1';
  const resetDone = searchParams.get('reset') === '1';

  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await initiateLogin(email, password);

      if (result.mode === 'error') {
        setError(result.error);
        return;
      }

      if (result.mode === 'otp') {
        setStep('otp');
        return;
      }

      // Direct login (no 2FA)
      const signInResult = await signIn('credentials', { email, password, redirect: false });
      if (signInResult?.error) {
        setError('Email ou mot de passe incorrect.');
        return;
      }
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }

  async function handleOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const signInResult = await signIn('credentials', {
        email,
        password,
        otp: otpCode,
        redirect: false,
      });

      if (signInResult?.error) {
        setError('Code invalide ou expiré. Vérifiez le code ou demandez-en un nouveau.');
        return;
      }
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    setError('');
    setLoading(true);
    try {
      const result = await initiateLogin(email, password);
      if (result.mode === 'error') {
        setError(result.error);
      } else {
        setOtpCode('');
      }
    } catch {
      setError('Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <Card className="relative w-full max-w-md border-white/10 bg-slate-900/80 backdrop-blur-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25">
            {step === 'otp' ? (
              <ShieldCheck className="h-7 w-7 text-white" />
            ) : (
              <BarChart3 className="h-7 w-7 text-white" />
            )}
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-white">
              {step === 'otp' ? 'Vérification en deux étapes' : 'Connexion à PeopleView'}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {step === 'otp'
                ? `Un code a été envoyé à ${email}`
                : 'Accédez à votre tableau de bord RH'}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Success banners */}
          {verified && step === 'credentials' && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Email vérifié avec succès. Vous pouvez vous connecter.
            </div>
          )}
          {resetDone && step === 'credentials' && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Mot de passe réinitialisé. Connectez-vous avec votre nouveau mot de passe.
            </div>
          )}

          {step === 'credentials' ? (
            <form onSubmit={handleCredentials} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="marie.dupont@techvision.fr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:border-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-slate-300">Mot de passe</Label>
                  <Link
                    href={"/forgot-password" as Route}
                    className="text-xs text-indigo-400 hover:text-indigo-300"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 font-semibold text-white hover:from-indigo-600 hover:to-violet-700 disabled:opacity-50"
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connexion…</>
                ) : (
                  'Se connecter'
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOtp} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="otp" className="text-slate-300">Code à 6 chiffres</Label>
                <Input
                  id="otp"
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  autoFocus
                  className="border-white/10 bg-white/5 text-center text-2xl font-bold tracking-[0.5em] text-white placeholder:text-slate-600 placeholder:tracking-normal placeholder:text-base focus:border-indigo-500"
                />
              </div>

              <Button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 font-semibold text-white hover:from-indigo-600 hover:to-violet-700 disabled:opacity-50"
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Vérification…</>
                ) : (
                  'Confirmer'
                )}
              </Button>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="w-full text-center text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                >
                  Renvoyer le code
                </button>
                <button
                  type="button"
                  onClick={() => { setStep('credentials'); setError(''); setOtpCode(''); }}
                  className="flex w-full items-center justify-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Retour
                </button>
              </div>
            </form>
          )}

          {step === 'credentials' && (
            <div className="mt-2 space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-slate-900 px-2 text-slate-500">Comptes de démo</span>
                </div>
              </div>

              <div className="space-y-2 rounded-lg border border-white/5 bg-white/5 p-3 text-xs text-slate-400">
                <p><span className="font-medium text-slate-300">Admin:</span> marie.dupont@techvision.fr</p>
                <p><span className="font-medium text-slate-300">Employé:</span> lucas.martin@techvision.fr</p>
                <p><span className="font-medium text-slate-300">Mot de passe:</span> password123</p>
              </div>

              <p className="text-center text-sm text-slate-400">
                Pas encore de compte ?{' '}
                <Link href="/register" className="font-medium text-indigo-400 hover:text-indigo-300">
                  Créer un compte
                </Link>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

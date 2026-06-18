'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart3, Loader2, Mail, CheckCircle2 } from 'lucide-react';
import { verifyEmailAddress, sendEmailVerificationOtp } from '@/actions/auth-otp';

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (!email) router.replace('/register');
  }, [email, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await verifyEmailAddress(email, code.trim());
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push('/login?verified=1');
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setResent(false);
    setError('');
    try {
      await sendEmailVerificationOtp(email);
      setResent(true);
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <Card className="border-white/10 bg-slate-900/80 backdrop-blur-xl">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25">
              <BarChart3 className="h-7 w-7 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-white">
                Vérifiez votre email
              </CardTitle>
              <CardDescription className="text-slate-400">
                Un code à 6 chiffres a été envoyé à
              </CardDescription>
              {email && (
                <p className="mt-1 text-sm font-medium text-indigo-400">{email}</p>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="flex items-start gap-3 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-4 py-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
              <p className="text-sm text-indigo-300">
                Entrez le code reçu par email pour activer votre compte. Vérifiez aussi vos spams.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}
              {resent && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Nouveau code envoyé.
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="code" className="text-slate-300">Code de vérification</Label>
                <Input
                  id="code"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  className="border-white/10 bg-white/5 text-center text-2xl font-bold tracking-[0.5em] text-white placeholder:text-slate-600 placeholder:tracking-normal placeholder:text-base focus:border-indigo-500"
                />
              </div>

              <Button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 font-semibold text-white hover:from-indigo-600 hover:to-violet-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Vérification…
                  </>
                ) : (
                  'Vérifier mon email'
                )}
              </Button>
            </form>

            <div className="border-t border-white/10 pt-4 space-y-3">
              <p className="text-center text-sm text-slate-400">
                Vous n&apos;avez pas reçu le code ?
              </p>
              <Button
                variant="outline"
                className="w-full border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                onClick={handleResend}
                disabled={resending}
              >
                {resending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Envoi en cours…</>
                ) : (
                  'Renvoyer le code'
                )}
              </Button>
              <p className="text-center text-xs text-slate-500">
                Mauvais email ?{' '}
                <Link href="/register" className="text-indigo-400 hover:text-indigo-300">
                  Créer un nouveau compte
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailForm />
    </Suspense>
  );
}

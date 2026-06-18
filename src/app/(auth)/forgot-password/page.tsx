'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart3, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { sendPasswordResetOtp } from '@/actions/auth-otp';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await sendPasswordResetOtp(email);
      setSent(true);
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

      <div className="relative w-full max-w-md">
        <Card className="border-white/10 bg-slate-900/80 backdrop-blur-xl">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25">
              <BarChart3 className="h-7 w-7 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-white">
                Mot de passe oublié
              </CardTitle>
              <CardDescription className="text-slate-400">
                {sent
                  ? 'Consultez votre boîte email'
                  : 'Entrez votre email pour recevoir un code'}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {sent ? (
              <div className="space-y-5">
                <div className="flex flex-col items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-6 py-6 text-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                  <div>
                    <p className="font-medium text-emerald-300">Email envoyé</p>
                    <p className="mt-1 text-sm text-emerald-400/80">
                      Si un compte est associé à <strong>{email}</strong>,
                      vous recevrez un code de réinitialisation sous quelques secondes.
                    </p>
                  </div>
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 font-semibold text-white"
                  onClick={() => router.push(`/reset-password?email=${encodeURIComponent(email)}` as Route)}
                >
                  Entrer mon code
                </Button>
                <p className="text-center text-xs text-slate-500">
                  Vérifiez aussi vos spams et indésirables.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">Adresse email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="marie@entreprise.fr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:border-indigo-500"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 font-semibold text-white hover:from-indigo-600 hover:to-violet-700 disabled:opacity-50"
                >
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Envoi en cours…</>
                  ) : (
                    'Envoyer le code'
                  )}
                </Button>
              </form>
            )}

            <div className="border-t border-white/10 pt-4">
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour à la connexion
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

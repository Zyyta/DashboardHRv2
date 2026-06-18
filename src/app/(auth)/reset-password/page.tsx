'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Route } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart3, Loader2, Eye, EyeOff, ArrowLeft, Check, X } from 'lucide-react';
import { resetPassword } from '@/actions/auth-otp';

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

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') ?? '';

  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordValid =
    newPassword.length >= 8 && /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!passwordValid) {
      setError('Le mot de passe ne respecte pas les critères de sécurité.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      const result = await resetPassword(emailParam, code.trim(), newPassword);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push('/login?reset=1');
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
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
                Nouveau mot de passe
              </CardTitle>
              <CardDescription className="text-slate-400">
                Entrez le code reçu par email et choisissez un nouveau mot de passe
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="code" className="text-slate-300">Code de réinitialisation</Label>
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

              <div className="space-y-2">
                <Label htmlFor="new-pw" className="text-slate-300">Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="new-pw"
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="border-white/10 bg-white/5 pr-10 text-white placeholder:text-slate-500 focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {newPassword.length > 0 && <PasswordRequirements password={newPassword} />}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-pw" className="text-slate-300">Confirmer le mot de passe</Label>
                <Input
                  id="confirm-pw"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={`border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:border-indigo-500 ${
                    confirmPassword && confirmPassword !== newPassword ? 'border-red-500/50' : ''
                  }`}
                />
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="text-xs text-red-400">Les mots de passe ne correspondent pas.</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading || code.length !== 6 || !passwordValid || newPassword !== confirmPassword}
                className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 font-semibold text-white hover:from-indigo-600 hover:to-violet-700 disabled:opacity-50"
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Réinitialisation…</>
                ) : (
                  'Réinitialiser le mot de passe'
                )}
              </Button>
            </form>

            <div className="border-t border-white/10 pt-4 space-y-2">
              <Link
                href={"/forgot-password" as Route}
                className="flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Renvoyer un code
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}

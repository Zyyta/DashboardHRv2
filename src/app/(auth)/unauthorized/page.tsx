import { auth, signOut } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { BarChart3, ShieldX } from 'lucide-react';

export default async function UnauthorizedPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Admins who land here by mistake go back to the dashboard
  if (session.user.role !== 'EMPLOYEE') {
    redirect('/dashboard');
  }

  const userName = session.user.name ?? session.user.email ?? 'Utilisateur';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-rose-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md text-center">
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-8 backdrop-blur-xl">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600">
            <BarChart3 className="h-7 w-7 text-white" />
          </div>

          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10">
            <ShieldX className="h-8 w-8 text-rose-400" />
          </div>

          <h1 className="mb-2 text-2xl font-bold text-white">Accès restreint</h1>
          <p className="mb-1 text-slate-400">
            PeopleView est un outil réservé aux équipes RH et administrateurs.
          </p>
          <p className="mb-6 text-sm text-slate-500">
            Connecté en tant que{' '}
            <span className="font-medium text-slate-300">{userName}</span>
          </p>

          <div className="mb-8 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
            Votre compte employé n&apos;a pas accès au tableau de bord analytique.
            Contactez votre responsable RH pour toute demande.
          </div>

          <form
            action={async () => {
              'use server';
              await signOut({ redirectTo: '/login' });
            }}
          >
            <button
              type="submit"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-white/10"
            >
              Se déconnecter
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

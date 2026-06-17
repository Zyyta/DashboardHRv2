import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';

interface ComingSoonProps {
  title: string;
  description: string;
  icon: LucideIcon;
  features?: string[];
}

export function ComingSoon({ title, description, icon: Icon, features }: ComingSoonProps) {
  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader
        title={title}
        breadcrumbs={[
          { label: 'PeopleView', href: '/dashboard' },
          { label: title },
        ]}
      />
      <div className="flex-1 space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10">
              <Icon className="h-8 w-8 text-indigo-500" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">Bientôt disponible</h2>
              <p className="max-w-md text-sm text-muted-foreground">
                Cette section est en cours de développement et sera disponible
                dans une prochaine mise à jour.
              </p>
            </div>

            {features && features.length > 0 && (
              <div className="mt-2 w-full max-w-md space-y-2 text-left">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Fonctionnalités prévues
                </p>
                <ul className="space-y-2">
                  {features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

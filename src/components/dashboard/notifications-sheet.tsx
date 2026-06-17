'use client';

import { useState, useTransition } from 'react';
import { Bell, AlertCircle, AlertTriangle, CheckCircle2, Info, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { getNotifications, type AppNotification, type NotificationLevel } from '@/actions/notifications';

const LEVEL_CONFIG: Record<NotificationLevel, {
  Icon: React.ElementType;
  iconClass: string;
  bg: string;
}> = {
  error:   { Icon: AlertCircle,   iconClass: 'text-red-500',     bg: 'bg-red-500/10' },
  warning: { Icon: AlertTriangle, iconClass: 'text-amber-500',   bg: 'bg-amber-500/10' },
  success: { Icon: CheckCircle2,  iconClass: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  info:    { Icon: Info,          iconClass: 'text-blue-500',    bg: 'bg-blue-500/10' },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "À l'instant";
  if (m < 60) return `Il y a ${m} min`;
  if (h < 24) return `Il y a ${h}h`;
  return `Il y a ${d} jour${d > 1 ? 's' : ''}`;
}

export function NotificationsSheet() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Uncontrolled sheet — let Radix manage open state, react to changes
  function handleOpenChange(isOpen: boolean) {
    if (isOpen && !loaded) {
      startTransition(async () => {
        const data = await getNotifications();
        setNotifications(data);
        setLoaded(true);
      });
    }
  }

  const visible = notifications.filter((n) => !dismissed.has(n.id));
  const unreadCount = visible.length;

  function dismissAll() {
    setDismissed(new Set(notifications.map((n) => n.id)));
  }

  function dismiss(id: string) {
    setDismissed((prev) => new Set([...prev, id]));
  }

  return (
    <Sheet onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground">
          <Bell className="h-5 w-5" />
          {loaded && unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          {!loaded && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md" showCloseButton={false}>
        <SheetHeader className="flex flex-row items-center justify-between border-b px-5 py-4 space-y-0">
          <div className="flex items-center gap-2">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4" /> Notifications
            </SheetTitle>
            {loaded && unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {loaded && unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={dismissAll}>
                Tout effacer
              </Button>
            )}
          </div>
        </SheetHeader>
        <SheetDescription className="sr-only">
          Alertes et informations générées depuis vos données RH.
        </SheetDescription>

        <div className="flex-1 overflow-y-auto">
          {isPending && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isPending && loaded && visible.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center px-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </div>
              <p className="text-sm text-muted-foreground">Aucune notification active.</p>
            </div>
          )}

          {!isPending && visible.length > 0 && (
            <div className="divide-y">
              {visible.map((notif) => {
                const { Icon, iconClass, bg } = LEVEL_CONFIG[notif.level];
                return (
                  <div key={notif.id} className="flex gap-3 px-5 py-4 hover:bg-muted/30 transition-colors">
                    <div className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${bg}`}>
                      <Icon className={`h-4 w-4 ${iconClass}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold leading-snug">{notif.title}</p>
                        <button
                          onClick={() => dismiss(notif.id)}
                          className="mt-0.5 flex-shrink-0 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        {notif.message}
                      </p>
                      <p className="mt-1.5 text-[10px] text-muted-foreground/60">
                        {timeAgo(notif.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t px-5 py-3">
          <p className="text-center text-[11px] text-muted-foreground">
            Alertes calculées automatiquement depuis vos données RH
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

'use client';

import { useState, useEffect, useTransition } from 'react';
import { Bell, AlertCircle, AlertTriangle, CheckCircle2, Info, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { getNotifications, type AppNotification, type NotificationLevel } from '@/actions/notifications';

const LEVEL_CONFIG: Record<NotificationLevel, {
  icon: React.ElementType;
  iconClass: string;
  bg: string;
  border: string;
}> = {
  error: {
    icon: AlertCircle,
    iconClass: 'text-red-500',
    bg: 'bg-red-500/10',
    border: 'border-red-200 dark:border-red-900',
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-200 dark:border-amber-900',
  },
  success: {
    icon: CheckCircle2,
    iconClass: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-200 dark:border-emerald-900',
  },
  info: {
    icon: Info,
    iconClass: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-200 dark:border-blue-900',
  },
};

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'À l\'instant';
  if (minutes < 60) return `Il y a ${minutes} min`;
  if (hours < 24) return `Il y a ${hours}h`;
  return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
}

export function NotificationsSheet() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (open && !loaded) {
      startTransition(async () => {
        const data = await getNotifications();
        setNotifications(data);
        setLoaded(true);
      });
    }
  }, [open, loaded]);

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  function markAllRead() {
    setReadIds(new Set(notifications.map((n) => n.id)));
  }

  function dismiss(id: string) {
    setReadIds((prev) => new Set([...prev, id]));
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          {unreadCount === 0 && loaded && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-emerald-500" />
          )}
          {!loaded && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:w-96 p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b flex flex-row items-center justify-between space-y-0">
          <SheetTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs h-5 px-1.5">
                {unreadCount}
              </Badge>
            )}
          </SheetTitle>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllRead}>
              Tout marquer lu
            </Button>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {isPending && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isPending && notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </div>
              <p className="text-sm text-muted-foreground">Aucune notification.</p>
            </div>
          )}

          {!isPending && notifications.length > 0 && (
            <div className="divide-y">
              {notifications.map((notif) => {
                const cfg = LEVEL_CONFIG[notif.level];
                const IconComp = cfg.icon;
                const isRead = readIds.has(notif.id);

                return (
                  <div
                    key={notif.id}
                    className={`relative flex gap-3 px-6 py-4 transition-colors hover:bg-muted/30 ${isRead ? 'opacity-60' : ''}`}
                  >
                    {/* unread dot */}
                    {!isRead && (
                      <span className="absolute left-3 top-5 h-1.5 w-1.5 rounded-full bg-primary" />
                    )}

                    <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${cfg.bg}`}>
                      <IconComp className={`h-4 w-4 ${cfg.iconClass}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-snug">{notif.title}</p>
                        <button
                          onClick={() => dismiss(notif.id)}
                          className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5"
                          aria-label="Fermer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1.5">
                        {timeAgo(notif.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t px-6 py-3">
          <p className="text-[11px] text-center text-muted-foreground">
            Les notifications sont générées automatiquement depuis vos données RH.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

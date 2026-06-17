'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Bell, Search } from 'lucide-react';
import { ThemeToggle } from '@/components/shared/theme-toggle';

interface BreadcrumbEntry {
  label: string;
  href?: string;
}

interface DashboardHeaderProps {
  title: string;
  breadcrumbs?: BreadcrumbEntry[];
}

export function DashboardHeader({ title, breadcrumbs }: DashboardHeaderProps) {
  const crumbs: BreadcrumbEntry[] = breadcrumbs ?? [
    { label: 'PeopleView', href: '/dashboard' },
    { label: title },
  ];

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-6">
      <SidebarTrigger className="-ml-2" />

      <Separator orientation="vertical" className="h-6" />

      <Breadcrumb>
        <BreadcrumbList>
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1;

            return (
              <span key={crumb.label} className="contents">
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={crumb.href}>
                      {crumb.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator />}
              </span>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="outline"
          className="hidden sm:flex h-9 gap-2 text-muted-foreground text-sm font-normal pr-2 pl-3 w-48 justify-between"
          onClick={() => window.dispatchEvent(new Event('palette:open'))}
        >
          <span className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Rechercher…
          </span>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden text-muted-foreground"
          onClick={() => window.dispatchEvent(new Event('palette:open'))}
        >
          <Search className="h-5 w-5" />
          <span className="sr-only">Rechercher</span>
        </Button>

        <Button variant="ghost" size="icon" className="relative text-muted-foreground">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
          <span className="sr-only">Notifications</span>
        </Button>

        <ThemeToggle />
      </div>
    </header>
  );
}

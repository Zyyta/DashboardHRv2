'use client';

import { useEffect, useState, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { Users, Building2, Loader2 } from 'lucide-react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import { searchGlobal, type SearchResult } from '@/actions/search';

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult>({ employees: [], departments: [] });
  const [isPending, startTransition] = useTransition();

  // Open on Ctrl+K / ⌘K and custom 'palette:open' event
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    const handleEvent = () => setOpen(true);

    window.addEventListener('keydown', handleKey);
    window.addEventListener('palette:open', handleEvent);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('palette:open', handleEvent);
    };
  }, []);

  // Debounced search
  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setResults({ employees: [], departments: [] });
      return;
    }
    const timer = setTimeout(() => {
      startTransition(async () => {
        const data = await searchGlobal(query);
        setResults(data);
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [query, open]);

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery('');
      router.push(href as Route);
    },
    [router],
  );

  const hasResults = results.employees.length > 0 || results.departments.length > 0;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Rechercher un employé, département…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {isPending && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isPending && query.trim().length >= 2 && !hasResults && (
          <CommandEmpty>Aucun résultat pour « {query} »</CommandEmpty>
        )}

        {!isPending && query.trim().length < 2 && (
          <CommandEmpty className="text-muted-foreground">
            Tapez au moins 2 caractères pour rechercher…
          </CommandEmpty>
        )}

        {results.employees.length > 0 && (
          <CommandGroup heading="Employés">
            {results.employees.map((emp) => (
              <CommandItem
                key={emp.id}
                value={emp.name}
                onSelect={() => navigate(`/dashboard/employees/${emp.id}`)}
              >
                <Users className="text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="font-medium">{emp.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {emp.position} · {emp.department}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results.employees.length > 0 && results.departments.length > 0 && <CommandSeparator />}

        {results.departments.length > 0 && (
          <CommandGroup heading="Départements">
            {results.departments.map((dept) => (
              <CommandItem
                key={dept.id}
                value={dept.name}
                onSelect={() => navigate('/dashboard/departments')}
              >
                <Building2 className="text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="font-medium">{dept.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {dept.employeeCount} employé{dept.employeeCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}

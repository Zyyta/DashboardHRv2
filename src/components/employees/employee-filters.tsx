'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import type { Route } from 'next';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Department {
  id: string;
  name: string;
  color: string | null;
}

interface EmployeeFiltersProps {
  departments: Department[];
  defaultSearch?: string;
  defaultStatus?: string;
  defaultDept?: string;
}

export function EmployeeFilters({
  departments,
  defaultSearch = '',
  defaultStatus = 'ALL',
  defaultDept = 'ALL',
}: EmployeeFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string | undefined) => {
      const next = new URLSearchParams(searchParams.toString());
      if (value && value !== 'ALL' && value !== '') {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      next.delete('page');
      router.push(`/dashboard/employees?${next.toString()}` as Route);
    },
    [router, searchParams]
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Input
        defaultValue={defaultSearch}
        placeholder="Rechercher par nom, poste, email…"
        className="max-w-sm"
        onChange={(e) => {
          const value = e.target.value;
          const next = new URLSearchParams(searchParams.toString());
          if (value) next.set('q', value);
          else next.delete('q');
          next.delete('page');
          router.push(`/dashboard/employees?${next.toString()}` as Route);
        }}
      />

      <div className="flex gap-3">
        <Select
          defaultValue={defaultStatus}
          onValueChange={(v) => updateParam('status', v)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les statuts</SelectItem>
            <SelectItem value="ACTIVE">Actifs</SelectItem>
            <SelectItem value="ON_LEAVE">En congé</SelectItem>
            <SelectItem value="TERMINATED">Partis</SelectItem>
          </SelectContent>
        </Select>

        <Select
          defaultValue={defaultDept || 'ALL'}
          onValueChange={(v) => updateParam('dept', v)}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Département" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les depts</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

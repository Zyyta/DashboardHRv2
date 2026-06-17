'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { Gender } from '@prisma/client';

export interface ImportRow {
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  gender: string;
  dateOfBirth: string;
  hireDate: string;
  salary: string;
  department: string;
  phone?: string;
  address?: string;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: { row: number; message: string }[];
}

function parseFlexibleDate(raw: string): Date | null {
  if (!raw?.trim()) return null;
  // dd/mm/yyyy or dd-mm-yyyy or dd.mm.yyyy
  const dmy = raw.trim().match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (dmy) {
    const year = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
    const d = new Date(`${year}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`);
    if (!isNaN(d.getTime())) return d;
  }
  // ISO or US format
  const d = new Date(raw.trim());
  if (!isNaN(d.getTime())) return d;
  return null;
}

function parseGender(raw: string): Gender | null {
  const s = raw.trim().toLowerCase();
  if (['m', 'h', 'male', 'homme', 'masculin', 'masc'].includes(s)) return 'MALE';
  if (['f', 'female', 'femme', 'féminin', 'feminin', 'fem'].includes(s)) return 'FEMALE';
  if (['o', 'x', 'other', 'autre', 'non-binaire', 'nonbinaire', 'nb'].includes(s)) return 'OTHER';
  return null;
}

export async function importEmployees(rows: ImportRow[]): Promise<ImportResult> {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error('Non autorisé');
  const orgId = session.user.organizationId;

  // Resolve/create all departments up-front
  const deptNames = [...new Set(rows.map((r) => r.department.trim()).filter(Boolean))];
  const deptMap = new Map<string, string>(); // lower-case name → id

  for (const name of deptNames) {
    const key = name.toLowerCase();
    const existing = await prisma.department.findFirst({
      where: { organizationId: orgId, name: { equals: name, mode: 'insensitive' } },
    });
    if (existing) {
      deptMap.set(key, existing.id);
    } else {
      const created = await prisma.department.create({
        data: { name, organizationId: orgId, color: '#6366f1' },
      });
      deptMap.set(key, created.id);
    }
  }

  let imported = 0;
  let skipped = 0;
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // row 1 = header

    try {
      const gender = parseGender(row.gender);
      if (!gender) {
        errors.push({ row: rowNum, message: `Genre invalide : "${row.gender}"` });
        skipped++;
        continue;
      }

      const dob = parseFlexibleDate(row.dateOfBirth);
      if (!dob) {
        errors.push({ row: rowNum, message: `Date de naissance invalide : "${row.dateOfBirth}"` });
        skipped++;
        continue;
      }

      const hireDate = parseFlexibleDate(row.hireDate);
      if (!hireDate) {
        errors.push({ row: rowNum, message: `Date d'embauche invalide : "${row.hireDate}"` });
        skipped++;
        continue;
      }

      const salary = parseFloat(row.salary.replace(/[^\d.,]/g, '').replace(',', '.'));
      if (isNaN(salary) || salary < 0) {
        errors.push({ row: rowNum, message: `Salaire invalide : "${row.salary}"` });
        skipped++;
        continue;
      }

      const deptId = deptMap.get(row.department.trim().toLowerCase());
      if (!deptId) {
        errors.push({ row: rowNum, message: `Département introuvable : "${row.department}"` });
        skipped++;
        continue;
      }

      const email = row.email.trim().toLowerCase();
      const existing = await prisma.employee.findFirst({
        where: { organizationId: orgId, email },
        select: { id: true },
      });
      if (existing) {
        errors.push({ row: rowNum, message: `Email déjà existant : "${email}"` });
        skipped++;
        continue;
      }

      await prisma.employee.create({
        data: {
          firstName: row.firstName.trim(),
          lastName: row.lastName.trim(),
          email,
          position: row.position.trim(),
          gender,
          dateOfBirth: dob,
          hireDate,
          salary,
          status: 'ACTIVE',
          phone: row.phone?.trim() || null,
          address: row.address?.trim() || null,
          organizationId: orgId,
          departmentId: deptId,
        },
      });
      imported++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur inconnue';
      errors.push({ row: rowNum, message: msg });
      skipped++;
    }
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/employees');
  revalidatePath('/dashboard/departments');

  return { imported, skipped, errors };
}

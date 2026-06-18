'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdminOrgId } from '@/lib/session';
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

interface ValidatedRow {
  rowNum: number;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  gender: Gender;
  dateOfBirth: Date;
  hireDate: Date;
  salary: number;
  department: string;
  phone: string | null;
  address: string | null;
}

function parseFlexibleDate(raw: string): Date | null {
  if (!raw?.trim()) return null;
  // dd/mm/yyyy or dd-mm-yyyy or dd.mm.yyyy
  const dmy = raw.trim().match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (dmy) {
    let year = dmy[3];
    if (year.length === 2) {
      const y = parseInt(year, 10);
      // 00-29 → 2000-2029, 30-99 → 1930-1999
      year = y <= 29 ? `20${year}` : `19${year}`;
    }
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
  const orgId = await requireAdminOrgId();

  const errors: { row: number; message: string }[] = [];

  // ── Step 1: Validate all rows in JS (zero DB queries) ─────────────────────
  const validRows: ValidatedRow[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    const gender = parseGender(row.gender);
    if (!gender) {
      errors.push({ row: rowNum, message: `Genre invalide : "${row.gender}"` });
      continue;
    }

    const dob = parseFlexibleDate(row.dateOfBirth);
    if (!dob) {
      errors.push({ row: rowNum, message: `Date de naissance invalide : "${row.dateOfBirth}"` });
      continue;
    }

    const hireDate = parseFlexibleDate(row.hireDate);
    if (!hireDate) {
      errors.push({ row: rowNum, message: `Date d'embauche invalide : "${row.hireDate}"` });
      continue;
    }

    const salary = parseFloat(row.salary.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (isNaN(salary) || salary < 0) {
      errors.push({ row: rowNum, message: `Salaire invalide : "${row.salary}"` });
      continue;
    }

    if (!row.department?.trim()) {
      errors.push({ row: rowNum, message: 'Département manquant.' });
      continue;
    }

    validRows.push({
      rowNum,
      firstName: row.firstName.trim(),
      lastName: row.lastName.trim(),
      email: row.email.trim().toLowerCase(),
      position: row.position.trim(),
      gender,
      dateOfBirth: dob,
      hireDate,
      salary,
      department: row.department.trim(),
      phone: row.phone?.trim() || null,
      address: row.address?.trim() || null,
    });
  }

  // ── Step 2: Resolve / create departments in parallel ──────────────────────
  const deptNames = [...new Set(validRows.map((r) => r.department))];
  const deptMap = new Map<string, string>(); // lower-case name → id

  const existingDepts = await prisma.department.findMany({
    where: {
      organizationId: orgId,
      name: { in: deptNames, mode: 'insensitive' },
    },
    select: { id: true, name: true },
  });
  for (const d of existingDepts) deptMap.set(d.name.toLowerCase(), d.id);

  // Create missing departments
  const missingNames = deptNames.filter((n) => !deptMap.has(n.toLowerCase()));
  if (missingNames.length > 0) {
    await prisma.department.createMany({
      data: missingNames.map((name) => ({ name, organizationId: orgId, color: '#6366f1' })),
      skipDuplicates: true,
    });
    const created = await prisma.department.findMany({
      where: { organizationId: orgId, name: { in: missingNames, mode: 'insensitive' } },
      select: { id: true, name: true },
    });
    for (const d of created) deptMap.set(d.name.toLowerCase(), d.id);
  }

  // Filter rows that still have no dept (edge case: name too long, etc.)
  const deptResolved: ValidatedRow[] = [];
  for (const row of validRows) {
    const deptId = deptMap.get(row.department.toLowerCase());
    if (!deptId) {
      errors.push({ row: row.rowNum, message: `Département introuvable : "${row.department}"` });
    } else {
      deptResolved.push(row);
    }
  }

  // ── Step 3: Batch-check existing emails in ONE query ──────────────────────
  const emailsToCheck = deptResolved.map((r) => r.email);
  const existingEmails = new Set(
    (
      await prisma.employee.findMany({
        where: { organizationId: orgId, email: { in: emailsToCheck } },
        select: { email: true },
      })
    ).map((e) => e.email),
  );

  const toCreate = deptResolved.filter((row) => {
    if (existingEmails.has(row.email)) {
      errors.push({ row: row.rowNum, message: `Email déjà existant : "${row.email}"` });
      return false;
    }
    return true;
  });

  // ── Step 4: Batch insert ───────────────────────────────────────────────────
  let imported = 0;
  if (toCreate.length > 0) {
    try {
      const result = await prisma.employee.createMany({
        data: toCreate.map((row) => ({
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email,
          position: row.position,
          gender: row.gender,
          dateOfBirth: row.dateOfBirth,
          hireDate: row.hireDate,
          salary: row.salary,
          status: 'ACTIVE' as const,
          phone: row.phone,
          address: row.address,
          organizationId: orgId,
          departmentId: deptMap.get(row.department.toLowerCase())!,
        })),
        skipDuplicates: true,
      });
      imported = result.count;
    } catch (e) {
      console.error('[importEmployees]', e);
      const msg = e instanceof Error ? e.message : 'Erreur inconnue';
      errors.push({ row: 0, message: `Erreur lors de l'insertion groupée : ${msg}` });
    }
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/employees');
  revalidatePath('/dashboard/departments');

  return { imported, skipped: rows.length - imported, errors };
}

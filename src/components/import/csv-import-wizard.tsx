'use client';

import { useState, useRef, useCallback, useTransition } from 'react';
import Papa from 'papaparse';
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  ChevronRight,
  ChevronLeft,
  Download,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { importEmployees, type ImportRow, type ImportResult } from '@/actions/import';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Field definitions & auto-detection
// ---------------------------------------------------------------------------

interface FieldDef {
  key: keyof ImportRow;
  label: string;
  required: boolean;
  hint: string;
}

const FIELDS: FieldDef[] = [
  { key: 'firstName', label: 'Prénom', required: true, hint: '' },
  { key: 'lastName', label: 'Nom de famille', required: true, hint: '' },
  { key: 'email', label: 'Email', required: true, hint: '' },
  { key: 'position', label: 'Poste / Titre', required: true, hint: '' },
  { key: 'gender', label: 'Genre', required: true, hint: 'M / H / F / Homme / Femme' },
  { key: 'dateOfBirth', label: 'Date de naissance', required: true, hint: 'jj/mm/aaaa' },
  { key: 'hireDate', label: "Date d'embauche", required: true, hint: 'jj/mm/aaaa' },
  { key: 'salary', label: 'Salaire brut (€)', required: true, hint: 'Nombre' },
  { key: 'department', label: 'Département', required: true, hint: 'Nom du département' },
  { key: 'phone', label: 'Téléphone', required: false, hint: '' },
  { key: 'address', label: 'Adresse', required: false, hint: '' },
];

const ALIASES: Record<string, string[]> = {
  firstName: ['prénom', 'prenom', 'first name', 'firstname', 'given name', 'forename'],
  lastName: ['nom', 'nom de famille', 'last name', 'lastname', 'surname', 'family name'],
  email: ['email', 'e-mail', 'courriel', 'mail', 'adresse mail', 'adresse email'],
  position: ['poste', 'titre', 'position', 'job title', 'fonction', 'function', 'role', 'rôle'],
  gender: ['genre', 'gender', 'sexe', 'sex', 'civilité', 'civilite'],
  dateOfBirth: ['date de naissance', 'naissance', 'dob', 'birth date', 'birthdate', 'date naissance', 'né le', 'nee le'],
  hireDate: ["date d'embauche", 'date embauche', 'hire date', 'hiredate', 'start date', "date d entree", 'date entree', 'date entrée', 'embauche'],
  salary: ['salaire', 'salary', 'rémunération', 'remuneration', 'wage', 'salaire brut', 'gross salary', 'traitement'],
  department: ['département', 'departement', 'department', 'service', 'équipe', 'equipe', 'team', 'division', 'dept'],
  phone: ['téléphone', 'telephone', 'phone', 'tel', 'mobile', 'portable', 'gsm'],
  address: ['adresse', 'address', 'domicile', 'résidence'],
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .trim();
}

function autoDetect(columns: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const field of FIELDS) {
    const aliases = ALIASES[field.key] ?? [];
    for (const col of columns) {
      const n = normalize(col);
      if (aliases.some((alias) => normalize(alias) === n || n.includes(normalize(alias)))) {
        mapping[field.key] = col;
        break;
      }
    }
  }
  return mapping;
}

// ---------------------------------------------------------------------------
// Client-side row validation
// ---------------------------------------------------------------------------

interface ValidatedRow {
  rowIndex: number;
  data: ImportRow;
  errors: string[];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$|^\d{4}-\d{2}-\d{2}/;
const GENDER_VALUES = ['m', 'h', 'f', 'male', 'female', 'homme', 'femme', 'other', 'autre', 'o', 'x', 'nb'];

function validateRow(row: ImportRow, index: number): ValidatedRow {
  const errors: string[] = [];
  if (!row.firstName?.trim()) errors.push('Prénom manquant');
  if (!row.lastName?.trim()) errors.push('Nom manquant');
  if (!row.email?.trim()) errors.push('Email manquant');
  else if (!EMAIL_RE.test(row.email.trim())) errors.push('Email invalide');
  if (!row.position?.trim()) errors.push('Poste manquant');
  if (!row.gender?.trim()) errors.push('Genre manquant');
  else if (!GENDER_VALUES.includes(row.gender.trim().toLowerCase())) errors.push(`Genre non reconnu: "${row.gender}"`);
  if (!row.dateOfBirth?.trim()) errors.push('Date de naissance manquante');
  else if (!DATE_RE.test(row.dateOfBirth.trim())) errors.push(`Date de naissance invalide: "${row.dateOfBirth}"`);
  if (!row.hireDate?.trim()) errors.push("Date d'embauche manquante");
  else if (!DATE_RE.test(row.hireDate.trim())) errors.push(`Date d'embauche invalide: "${row.hireDate}"`);
  if (!row.salary?.trim()) errors.push('Salaire manquant');
  else if (isNaN(parseFloat(row.salary.replace(/[^\d.,]/g, '').replace(',', '.')))) errors.push(`Salaire invalide: "${row.salary}"`);
  if (!row.department?.trim()) errors.push('Département manquant');
  return { rowIndex: index, data: row, errors };
}

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

const STEPS = ['Fichier', 'Colonnes', 'Aperçu', 'Résultat'];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                i < current
                  ? 'bg-primary text-primary-foreground'
                  : i === current
                  ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {i < current ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`text-xs ${i === current ? 'font-medium' : 'text-muted-foreground'}`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`mb-5 mx-2 h-0.5 w-12 transition-colors ${i < current ? 'bg-primary' : 'bg-muted'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main wizard
// ---------------------------------------------------------------------------

export function CsvImportWizard() {
  const [step, setStep] = useState(0);
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState('');
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [validated, setValidated] = useState<ValidatedRow[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  // ---- Step 0: Upload ----

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Format non supporté. Utilisez un fichier .csv');
      return;
    }
    setFileName(file.name);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const cols = res.meta.fields ?? [];
        setCsvColumns(cols);
        setRawRows(res.data);
        setMapping(autoDetect(cols));
        setStep(1);
      },
      error: () => toast.error('Impossible de lire le fichier CSV.'),
    });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  // ---- Step 1 → 2: Build validated rows ----

  function buildValidated() {
    const rows: ValidatedRow[] = rawRows.map((raw, i) => {
      const row: ImportRow = {
        firstName: mapping.firstName ? (raw[mapping.firstName] ?? '') : '',
        lastName: mapping.lastName ? (raw[mapping.lastName] ?? '') : '',
        email: mapping.email ? (raw[mapping.email] ?? '') : '',
        position: mapping.position ? (raw[mapping.position] ?? '') : '',
        gender: mapping.gender ? (raw[mapping.gender] ?? '') : '',
        dateOfBirth: mapping.dateOfBirth ? (raw[mapping.dateOfBirth] ?? '') : '',
        hireDate: mapping.hireDate ? (raw[mapping.hireDate] ?? '') : '',
        salary: mapping.salary ? (raw[mapping.salary] ?? '') : '',
        department: mapping.department ? (raw[mapping.department] ?? '') : '',
        phone: mapping.phone ? (raw[mapping.phone] ?? '') : '',
        address: mapping.address ? (raw[mapping.address] ?? '') : '',
      };
      return validateRow(row, i + 2);
    });
    setValidated(rows);
    setStep(2);
  }

  // ---- Step 2 → 3: Run import ----

  function runImport() {
    const validRows = validated.filter((v) => v.errors.length === 0).map((v) => v.data);
    if (validRows.length === 0) {
      toast.error('Aucune ligne valide à importer.');
      return;
    }
    startTransition(async () => {
      try {
        const res = await importEmployees(validRows);
        setResult(res);
        setStep(3);
        toast.success(`${res.imported} employé${res.imported !== 1 ? 's' : ''} importé${res.imported !== 1 ? 's' : ''} avec succès.`);
      } catch {
        toast.error('Une erreur est survenue lors de l\'import.');
      }
    });
  }

  // ---- Error CSV download ----

  function downloadErrors() {
    if (!result) return;
    const lines = ['Ligne,Erreur', ...result.errors.map((e) => `${e.row},"${e.message}"`)];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'erreurs_import.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  const validCount = validated.filter((v) => v.errors.length === 0).length;
  const errorRows = validated.filter((v) => v.errors.length > 0);

  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-8">
      <StepIndicator current={step} />

      {/* ---- Step 0: Upload ---- */}
      {step === 0 && (
        <div className="space-y-4">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-16 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/40 transition-all"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold">Glissez votre fichier CSV ici</p>
              <p className="text-sm text-muted-foreground mt-1">ou cliquez pour sélectionner</p>
            </div>
            <Badge variant="outline">Format accepté : .csv (UTF-8 ou ISO-8859-1)</Badge>
            <p className="text-xs text-muted-foreground max-w-sm">
              Conseil : dans Excel, faites <strong>Fichier → Enregistrer sous → CSV (séparateur point-virgule)</strong>
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>
      )}

      {/* ---- Step 1: Column mapping ---- */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span><strong>{fileName}</strong> · {rawRows.length} lignes détectées · {csvColumns.length} colonnes</span>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-1">
                <div className="grid grid-cols-3 gap-4 pb-3 border-b text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  <span>Champ PeopleView</span>
                  <span>Colonne CSV</span>
                  <span>Exemple</span>
                </div>
                {FIELDS.map((field) => (
                  <div key={field.key} className="grid grid-cols-3 gap-4 items-center py-2 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{field.label}</span>
                      {field.required ? (
                        <Badge variant="outline" className="text-[10px] text-red-500 border-red-200">requis</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">optionnel</Badge>
                      )}
                      {field.hint && <span className="text-xs text-muted-foreground">({field.hint})</span>}
                    </div>
                    <Select
                      value={mapping[field.key] ?? '__none__'}
                      onValueChange={(val) =>
                        setMapping((prev) => ({
                          ...prev,
                          [field.key]: val === '__none__' ? '' : val,
                        }))
                      }
                    >
                      <SelectTrigger className={`h-8 text-sm ${mapping[field.key] ? '' : field.required ? 'border-red-300' : ''}`}>
                        <SelectValue placeholder="— ignorer —" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— ignorer —</SelectItem>
                        {csvColumns.map((col) => (
                          <SelectItem key={col} value={col}>{col}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-xs text-muted-foreground truncate">
                      {mapping[field.key] && rawRows[0]
                        ? (rawRows[0][mapping[field.key]] ?? '—')
                        : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(0)}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Retour
            </Button>
            <Button onClick={buildValidated}>
              Valider le mapping <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ---- Step 2: Preview & validate ---- */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-emerald-200 dark:border-emerald-900">
              <CardContent className="flex items-center gap-3 pt-6">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                <div>
                  <p className="text-2xl font-bold text-emerald-500">{validCount}</p>
                  <p className="text-sm text-muted-foreground">lignes prêtes</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-red-200 dark:border-red-900">
              <CardContent className="flex items-center gap-3 pt-6">
                <AlertCircle className="h-8 w-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-red-500">{errorRows.length}</p>
                  <p className="text-sm text-muted-foreground">lignes ignorées</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 pt-6">
                <FileText className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{validated.length}</p>
                  <p className="text-sm text-muted-foreground">lignes total</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Errors */}
          {errorRows.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm font-medium mb-3 text-red-500 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" /> Lignes avec erreurs (seront ignorées)
                </p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {errorRows.slice(0, 15).map((row) => (
                    <div key={row.rowIndex} className="flex gap-2 text-xs">
                      <span className="font-mono text-muted-foreground w-12 shrink-0">Ligne {row.rowIndex}</span>
                      <span className="text-red-500">{row.errors.join(' · ')}</span>
                    </div>
                  ))}
                  {errorRows.length > 15 && (
                    <p className="text-xs text-muted-foreground">… et {errorRows.length - 15} autres erreurs</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview table */}
          {validCount > 0 && (
            <Card>
              <CardContent className="pt-6 overflow-x-auto">
                <p className="text-sm font-medium mb-3">Aperçu des 5 premières lignes valides</p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="pb-2 text-left font-medium">Nom</th>
                      <th className="pb-2 text-left font-medium">Email</th>
                      <th className="pb-2 text-left font-medium">Poste</th>
                      <th className="pb-2 text-left font-medium">Département</th>
                      <th className="pb-2 text-left font-medium">Embauche</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {validated.filter((v) => v.errors.length === 0).slice(0, 5).map((row) => (
                      <tr key={row.rowIndex}>
                        <td className="py-1.5 pr-3">{row.data.firstName} {row.data.lastName}</td>
                        <td className="py-1.5 pr-3 text-muted-foreground">{row.data.email}</td>
                        <td className="py-1.5 pr-3">{row.data.position}</td>
                        <td className="py-1.5 pr-3">{row.data.department}</td>
                        <td className="py-1.5">{row.data.hireDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Retour
            </Button>
            <Button onClick={runImport} disabled={isPending || validCount === 0}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Import en cours…
                </>
              ) : (
                <>
                  Importer {validCount} ligne{validCount !== 1 ? 's' : ''} <ChevronRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ---- Step 3: Result ---- */}
      {step === 3 && result && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-emerald-200 dark:border-emerald-900">
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-emerald-500">{result.imported}</p>
                  <p className="text-sm text-muted-foreground">
                    employé{result.imported !== 1 ? 's' : ''} importé{result.imported !== 1 ? 's' : ''}
                  </p>
                </div>
              </CardContent>
            </Card>
            {result.skipped > 0 && (
              <Card className="border-red-200 dark:border-red-900">
                <CardContent className="flex items-center gap-4 pt-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
                    <X className="h-8 w-8 text-red-500" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-red-500">{result.skipped}</p>
                    <p className="text-sm text-muted-foreground">
                      ligne{result.skipped !== 1 ? 's' : ''} ignorée{result.skipped !== 1 ? 's' : ''}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {result.errors.length > 0 && (
            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Détail des erreurs</p>
                  <Button variant="outline" size="sm" onClick={downloadErrors}>
                    <Download className="mr-2 h-3.5 w-3.5" />
                    Télécharger CSV
                  </Button>
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {result.errors.slice(0, 20).map((err, i) => (
                    <div key={i} className="flex gap-2 text-xs">
                      <span className="font-mono text-muted-foreground w-12 shrink-0">L.{err.row}</span>
                      <span className="text-red-500">{err.message}</span>
                    </div>
                  ))}
                  {result.errors.length > 20 && (
                    <p className="text-xs text-muted-foreground">… et {result.errors.length - 20} autres</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => { setStep(0); setFileName(''); setResult(null); setValidated([]); }}
            >
              Nouvel import
            </Button>
            <Button asChild>
              <a href="/dashboard/employees">Voir les employés →</a>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

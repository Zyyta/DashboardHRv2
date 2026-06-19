'use client';

import { useState, useTransition } from 'react';
import {
  Plus, MoreVertical, Pencil, Trash2, Loader2,
  UserCheck, UserX, Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  createEmployee,
  updateEmployee,
  updateEmployeeStatus,
  deleteEmployee,
  type EmployeeRow,
} from '@/actions/employees';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Dept {
  id: string;
  name: string;
  color: string | null;
}

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  gender: string;
  dateOfBirth: string;
  hireDate: string;
  salary: string;
  departmentId: string;
  departmentName: string;
  status: string;
  phone: string;
  address: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function toDateStr(date: Date | string): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const EMPTY_FORM: FormState = {
  firstName: '', lastName: '', email: '', position: '',
  gender: 'MALE', dateOfBirth: '', hireDate: todayStr(),
  salary: '', departmentId: '', departmentName: '', status: 'ACTIVE',
  phone: '', address: '',
};

function fromEmployee(emp: EmployeeRow): FormState {
  return {
    firstName: emp.firstName,
    lastName: emp.lastName,
    email: emp.email,
    position: emp.position,
    gender: emp.gender,
    dateOfBirth: toDateStr(emp.dateOfBirth),
    hireDate: toDateStr(emp.hireDate),
    salary: String(emp.salary),
    departmentId: emp.department.id,
    departmentName: emp.department.name,
    status: emp.status,
    phone: emp.phone ?? '',
    address: emp.address ?? '',
  };
}

// ─── Shared form body ─────────────────────────────────────────────────────────

function EmployeeFormBody({
  form,
  onChange,
  departments,
  showStatus,
  isPending,
  freeDepartmentInput = false,
}: {
  form: FormState;
  onChange: (field: keyof FormState, value: string) => void;
  departments: Dept[];
  showStatus: boolean;
  isPending: boolean;
  freeDepartmentInput?: boolean;
}) {
  const f = (field: keyof FormState) => (value: string) => onChange(field, value);

  return (
    <div className="grid gap-4 py-2">
      {/* Row 1 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="ef-firstName">Prénom *</Label>
          <Input
            id="ef-firstName"
            placeholder="Marie"
            value={form.firstName}
            onChange={(e) => onChange('firstName', e.target.value)}
            disabled={isPending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ef-lastName">Nom *</Label>
          <Input
            id="ef-lastName"
            placeholder="Dupont"
            value={form.lastName}
            onChange={(e) => onChange('lastName', e.target.value)}
            disabled={isPending}
          />
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="ef-email">Email *</Label>
          <Input
            id="ef-email"
            type="email"
            placeholder="marie@company.fr"
            value={form.email}
            onChange={(e) => onChange('email', e.target.value)}
            disabled={isPending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ef-phone">Téléphone</Label>
          <Input
            id="ef-phone"
            placeholder="+33 6 00 00 00 00"
            value={form.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            disabled={isPending}
          />
        </div>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="ef-position">Poste *</Label>
          <Input
            id="ef-position"
            placeholder="Développeur Senior"
            value={form.position}
            onChange={(e) => onChange('position', e.target.value)}
            disabled={isPending}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Genre *</Label>
          <Select value={form.gender} onValueChange={f('gender')} disabled={isPending}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MALE">Homme</SelectItem>
              <SelectItem value="FEMALE">Femme</SelectItem>
              <SelectItem value="OTHER">Autre / Non précisé</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 4 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="ef-dob">Date de naissance *</Label>
          <Input
            id="ef-dob"
            type="date"
            max={todayStr()}
            value={form.dateOfBirth}
            onChange={(e) => onChange('dateOfBirth', e.target.value)}
            disabled={isPending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ef-hireDate">Date d'embauche *</Label>
          <Input
            id="ef-hireDate"
            type="date"
            max={todayStr()}
            value={form.hireDate}
            onChange={(e) => onChange('hireDate', e.target.value)}
            disabled={isPending}
          />
        </div>
      </div>

      {/* Row 5 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="ef-salary">Salaire brut annuel (€) *</Label>
          <Input
            id="ef-salary"
            type="number"
            min="0"
            step="100"
            placeholder="45000"
            value={form.salary}
            onChange={(e) => onChange('salary', e.target.value)}
            disabled={isPending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ef-department">Département *</Label>
          {freeDepartmentInput ? (
            <Input
              id="ef-department"
              placeholder="Ressources Humaines"
              value={form.departmentName}
              onChange={(e) => onChange('departmentName', e.target.value)}
              disabled={isPending}
            />
          ) : (
            <Select value={form.departmentId} onValueChange={f('departmentId')} disabled={isPending}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner…" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Status (edit only) */}
      {showStatus && (
        <div className="space-y-1.5">
          <Label>Statut</Label>
          <Select value={form.status} onValueChange={f('status')} disabled={isPending}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Actif</SelectItem>
              <SelectItem value="ON_LEAVE">En congé</SelectItem>
              <SelectItem value="TERMINATED">Parti (terminé)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Address */}
      <div className="space-y-1.5">
        <Label htmlFor="ef-address">Adresse</Label>
        <Textarea
          id="ef-address"
          placeholder="12 rue de la Paix, 75001 Paris"
          rows={2}
          value={form.address}
          onChange={(e) => onChange('address', e.target.value)}
          disabled={isPending}
          className="resize-none"
        />
      </div>
    </div>
  );
}

// ─── Add Employee Button ──────────────────────────────────────────────────────

export function AddEmployeeButton({ departments }: { departments: Dept[] }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isPending, startTransition] = useTransition();

  function onChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleOpen(isOpen: boolean) {
    if (isOpen) setForm({ ...EMPTY_FORM, hireDate: todayStr() });
    setOpen(isOpen);
  }

  function validate(): string | null {
    if (!form.firstName.trim()) return 'Le prénom est requis.';
    if (!form.lastName.trim()) return 'Le nom est requis.';
    if (!form.email.trim()) return "L'email est requis.";
    if (!form.position.trim()) return 'Le poste est requis.';
    if (!form.dateOfBirth) return 'La date de naissance est requise.';
    if (!form.hireDate) return "La date d'embauche est requise.";
    if (!form.salary || isNaN(parseFloat(form.salary))) return 'Un salaire valide est requis.';
    if (!form.departmentName.trim()) return 'Le département est requis.';
    return null;
  }

  function handleSubmit() {
    const err = validate();
    if (err) { toast.error(err); return; }

    startTransition(async () => {
      const result = await createEmployee({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        position: form.position,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth,
        hireDate: form.hireDate,
        salary: form.salary,
        departmentName: form.departmentName,
        phone: form.phone || undefined,
        address: form.address || undefined,
      });

      if (result.success) {
        toast.success('Employé créé avec succès.');
        setOpen(false);
      } else {
        toast.error(result.error ?? 'Une erreur est survenue.');
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <Button onClick={() => handleOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Nouvel employé
      </Button>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajouter un employé</DialogTitle>
          <DialogDescription>
            Remplissez les informations pour créer un nouveau profil employé.
          </DialogDescription>
        </DialogHeader>

        <EmployeeFormBody
          form={form}
          onChange={onChange}
          departments={departments}
          showStatus={false}
          isPending={isPending}
          freeDepartmentInput
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Créer l'employé
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Row Actions ─────────────────────────────────────────────────────────────

export function EmployeeRowActions({
  employee,
  departments,
}: {
  employee: EmployeeRow;
  departments: Dept[];
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [form, setForm] = useState<FormState>(() => fromEmployee(employee));
  const [isPending, startTransition] = useTransition();

  function onChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function openEdit() {
    setForm(fromEmployee(employee));
    setEditOpen(true);
  }

  function validate(): string | null {
    if (!form.firstName.trim()) return 'Le prénom est requis.';
    if (!form.lastName.trim()) return 'Le nom est requis.';
    if (!form.email.trim()) return "L'email est requis.";
    if (!form.position.trim()) return 'Le poste est requis.';
    if (!form.dateOfBirth) return 'La date de naissance est requise.';
    if (!form.hireDate) return "La date d'embauche est requise.";
    if (!form.salary || isNaN(parseFloat(form.salary))) return 'Un salaire valide est requis.';
    if (!form.departmentId) return 'Veuillez sélectionner un département.';
    return null;
  }

  function handleEdit() {
    const err = validate();
    if (err) { toast.error(err); return; }

    startTransition(async () => {
      const result = await updateEmployee(employee.id, {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        position: form.position,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth,
        hireDate: form.hireDate,
        salary: form.salary,
        departmentId: form.departmentId,
        status: form.status,
        phone: form.phone || undefined,
        address: form.address || undefined,
      });

      if (result.success) {
        toast.success('Employé mis à jour.');
        setEditOpen(false);
      } else {
        toast.error(result.error ?? 'Une erreur est survenue.');
      }
    });
  }

  function handleQuickStatus(status: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED') {
    startTransition(async () => {
      const result = await updateEmployeeStatus(employee.id, status);
      if (result.success) toast.success('Statut mis à jour.');
      else toast.error(result.error ?? 'Une erreur est survenue.');
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteEmployee(employee.id);
      if (result.success) {
        toast.success('Employé supprimé.');
        setDeleteOpen(false);
      } else {
        toast.error(result.error ?? 'Une erreur est survenue.');
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreVertical className="h-4 w-4" />
            )}
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onClick={openEdit} className="gap-2">
            <Pencil className="h-4 w-4" />
            Modifier
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
            Changer le statut
          </div>
          <DropdownMenuItem
            onClick={() => handleQuickStatus('ACTIVE')}
            disabled={employee.status === 'ACTIVE'}
            className="gap-2"
          >
            <UserCheck className="h-4 w-4 text-emerald-500" />
            Actif
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleQuickStatus('ON_LEAVE')}
            disabled={employee.status === 'ON_LEAVE'}
            className="gap-2"
          >
            <Clock className="h-4 w-4 text-amber-500" />
            En congé
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleQuickStatus('TERMINATED')}
            disabled={employee.status === 'TERMINATED'}
            className="gap-2"
          >
            <UserX className="h-4 w-4 text-red-500" />
            Parti (terminé)
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="gap-2 text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Modifier — {employee.firstName} {employee.lastName}
            </DialogTitle>
            <DialogDescription>
              Modifiez les informations de ce profil employé.
            </DialogDescription>
          </DialogHeader>

          <EmployeeFormBody
            form={form}
            onChange={onChange}
            departments={departments}
            showStatus
            isPending={isPending}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={isPending}>
              Annuler
            </Button>
            <Button onClick={handleEdit} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Supprimer {employee.firstName} {employee.lastName} ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le profil, les congés et les données associées à cet
              employé seront définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

import { z } from 'zod';

export const CreateEmployeeSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est obligatoire.').max(100),
  lastName: z.string().min(1, 'Le nom est obligatoire.').max(100),
  email: z.string().email('Adresse email invalide.'),
  position: z.string().min(1, 'Le poste est obligatoire.').max(200),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER'], { message: 'Genre invalide.' }),
  dateOfBirth: z.string().min(1, 'La date de naissance est obligatoire.'),
  hireDate: z.string().min(1, "La date d'embauche est obligatoire."),
  salary: z.string().min(1, 'Le salaire est obligatoire.'),
  departmentId: z.string().cuid('Département invalide.'),
  phone: z.string().max(30).optional(),
  address: z.string().max(500).optional(),
});

export const UpdateEmployeeSchema = CreateEmployeeSchema.extend({
  status: z.enum(['ACTIVE', 'ON_LEAVE', 'TERMINATED'], { message: 'Statut invalide.' }),
});

export const CreateDepartmentSchema = z.object({
  name: z.string().min(1, 'Le nom est obligatoire.').max(100),
  description: z.string().max(500).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Couleur hexadécimale invalide (ex: #6366f1).')
    .default('#6366f1'),
});

export const UpdateDepartmentSchema = CreateDepartmentSchema;

export const RegisterSchema = z.object({
  name: z.string().min(1, 'Le nom est obligatoire.').max(100),
  email: z.string().email('Adresse email invalide.'),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères.'),
  companyName: z.string().min(1, "Le nom de l'entreprise est obligatoire.").max(200),
});

export const JoinOrgSchema = z.object({
  name: z.string().min(1, 'Le nom est obligatoire.').max(100),
  email: z.string().email('Adresse email invalide.'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères.'),
  inviteCode: z.string().min(1, "Le code d'invitation est obligatoire."),
});

export const UpdateUserProfileSchema = z.object({
  name: z.string().min(1, 'Le nom est obligatoire.').max(100),
});

export const UpdateOrgProfileSchema = z.object({
  name: z.string().min(1, "Le nom de l'organisation est obligatoire.").max(200),
  domain: z.string().max(253).optional().default(''),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Le mot de passe actuel est obligatoire.'),
  newPassword: z.string().min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères.'),
});

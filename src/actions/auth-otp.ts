'use server';

import { revalidatePath } from 'next/cache';
import { hash } from 'bcryptjs';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createAndSendOtp, verifyOtp } from '@/lib/otp';
import { passwordSchema, ResetPasswordSchema } from '@/lib/validators';
import { auth } from '@/lib/auth';
import type { ActionResult } from '@/types';

// ---------------------------------------------------------------------------
// Login initiation — validates credentials, sends 2FA OTP if enabled
// ---------------------------------------------------------------------------

export type LoginInitResult =
  | { mode: 'direct' }
  | { mode: 'otp' }
  | { mode: 'error'; error: string };

export async function initiateLogin(
  email: string,
  password: string
): Promise<LoginInitResult> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, password: true, twoFactorEnabled: true, emailVerified: true },
  });

  if (!user?.password) return { mode: 'error', error: 'Email ou mot de passe incorrect.' };

  const valid = await compare(password, user.password);
  if (!valid) return { mode: 'error', error: 'Email ou mot de passe incorrect.' };

  if (!user.emailVerified) {
    return {
      mode: 'error',
      error: 'Veuillez vérifier votre adresse email avant de vous connecter.',
    };
  }

  if (user.twoFactorEnabled) {
    await createAndSendOtp(user.id, 'TWO_FACTOR', email);
    return { mode: 'otp' };
  }

  return { mode: 'direct' };
}

// ---------------------------------------------------------------------------
// Email verification — sent after registration
// ---------------------------------------------------------------------------

export async function sendEmailVerificationOtp(email: string): Promise<ActionResult> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, emailVerified: true },
  });
  if (!user) return { success: true }; // enumeration-safe
  if (user.emailVerified) return { success: true };

  try {
    await createAndSendOtp(user.id, 'EMAIL_VERIFY', email);
  } catch (e) {
    console.error('[sendEmailVerificationOtp]', e);
    return { success: false, error: "Erreur lors de l'envoi de l'email." };
  }
  return { success: true };
}

export async function verifyEmailAddress(
  email: string,
  code: string
): Promise<ActionResult> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, emailVerified: true },
  });
  if (!user) return { success: false, error: 'Compte introuvable.' };
  if (user.emailVerified) return { success: true };

  const result = await verifyOtp(user.id, 'EMAIL_VERIFY', code);
  if (!result.success) return result;

  await prisma.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } });
  return { success: true };
}

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------

export async function sendPasswordResetOtp(email: string): Promise<ActionResult> {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (user) {
    try {
      await createAndSendOtp(user.id, 'PASSWORD_RESET', email);
    } catch (e) {
      console.error('[sendPasswordResetOtp]', e);
    }
  }
  // Always return success — enumeration-safe
  return { success: true };
}

export async function resetPassword(
  email: string,
  code: string,
  newPassword: string
): Promise<ActionResult> {
  const parsed = ResetPasswordSchema.safeParse({ email, code, newPassword });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return { success: false, error: 'Compte introuvable.' };

  const result = await verifyOtp(user.id, 'PASSWORD_RESET', code);
  if (!result.success) return result;

  const hashed = await hash(newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
  return { success: true };
}

// ---------------------------------------------------------------------------
// Two-factor authentication — settings management
// ---------------------------------------------------------------------------

export async function sendTwoFactorOtp(): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email)
    return { success: false, error: 'Non autorisé.' };

  try {
    await createAndSendOtp(session.user.id, 'TWO_FACTOR', session.user.email);
  } catch (e) {
    console.error('[sendTwoFactorOtp]', e);
    return { success: false, error: "Erreur lors de l'envoi de l'email." };
  }
  return { success: true };
}

export async function enableTwoFactor(code: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: 'Non autorisé.' };

  const result = await verifyOtp(session.user.id, 'TWO_FACTOR', code);
  if (!result.success) return result;

  await prisma.user.update({ where: { id: session.user.id }, data: { twoFactorEnabled: true } });
  revalidatePath('/dashboard/settings');
  return { success: true };
}

export async function disableTwoFactor(code: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: 'Non autorisé.' };

  const result = await verifyOtp(session.user.id, 'TWO_FACTOR', code);
  if (!result.success) return result;

  await prisma.user.update({ where: { id: session.user.id }, data: { twoFactorEnabled: false } });
  revalidatePath('/dashboard/settings');
  return { success: true };
}

// ---------------------------------------------------------------------------
// Account deletion
// ---------------------------------------------------------------------------

export async function sendDeleteAccountOtp(): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email)
    return { success: false, error: 'Non autorisé.' };

  // Block if user is the sole ORG_ADMIN — deleting would orphan the organization
  if (session.user.role === 'ORG_ADMIN' && session.user.organizationId) {
    const adminCount = await prisma.user.count({
      where: { organizationId: session.user.organizationId, role: 'ORG_ADMIN' },
    });
    if (adminCount <= 1) {
      return {
        success: false,
        error:
          "Vous êtes le seul administrateur. Transférez l'administration avant de supprimer votre compte.",
      };
    }
  }

  try {
    await createAndSendOtp(session.user.id, 'DELETE_ACCOUNT', session.user.email);
  } catch (e) {
    console.error('[sendDeleteAccountOtp]', e);
    return { success: false, error: "Erreur lors de l'envoi de l'email." };
  }
  return { success: true };
}

export async function deleteAccount(
  code: string
): Promise<ActionResult & { requiresSignOut?: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: 'Non autorisé.' };

  const result = await verifyOtp(session.user.id, 'DELETE_ACCOUNT', code);
  if (!result.success) return result;

  await prisma.user.delete({ where: { id: session.user.id } });
  return { success: true, requiresSignOut: true };
}

// ---------------------------------------------------------------------------
// Validate password strength (client-side helper exposed as action)
// ---------------------------------------------------------------------------

export async function validatePasswordStrength(password: string): Promise<{
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasNumber: boolean;
  isValid: boolean;
}> {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return {
    hasMinLength,
    hasUppercase,
    hasNumber,
    isValid: hasMinLength && hasUppercase && hasNumber,
  };
}

import { prisma } from './prisma';
import { hash, compare } from 'bcryptjs';
import { sendOtpEmail } from './email';
import type { OtpPurpose } from '@prisma/client';

const TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createAndSendOtp(
  userId: string,
  purpose: OtpPurpose,
  email: string
): Promise<void> {
  const code = generateCode();
  const codeHash = await hash(code, 10);
  const expiresAt = new Date(Date.now() + TTL_MINUTES * 60 * 1000);

  await prisma.otpCode.upsert({
    where: { userId_purpose: { userId, purpose } },
    create: { userId, purpose, codeHash, expiresAt, attempts: 0 },
    update: { codeHash, expiresAt, attempts: 0 },
  });

  await sendOtpEmail(email, code, purpose);
}

export async function verifyOtp(
  userId: string,
  purpose: OtpPurpose,
  code: string
): Promise<{ success: true } | { success: false; error: string }> {
  const record = await prisma.otpCode.findUnique({
    where: { userId_purpose: { userId, purpose } },
  });

  if (!record) return { success: false, error: 'Code invalide ou expiré.' };

  if (record.expiresAt < new Date()) {
    await prisma.otpCode.delete({ where: { userId_purpose: { userId, purpose } } });
    return { success: false, error: 'Code expiré. Demandez un nouveau code.' };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    await prisma.otpCode.delete({ where: { userId_purpose: { userId, purpose } } });
    return { success: false, error: 'Trop de tentatives. Demandez un nouveau code.' };
  }

  const valid = await compare(code, record.codeHash);

  if (!valid) {
    await prisma.otpCode.update({
      where: { userId_purpose: { userId, purpose } },
      data: { attempts: { increment: 1 } },
    });
    const remaining = MAX_ATTEMPTS - record.attempts - 1;
    return {
      success: false,
      error: `Code incorrect. ${remaining} tentative${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}.`,
    };
  }

  await prisma.otpCode.delete({ where: { userId_purpose: { userId, purpose } } });
  return { success: true };
}

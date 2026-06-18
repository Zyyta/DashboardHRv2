import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { RegisterSchema } from '@/lib/validators';

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }
    const { name, email, password, companyName } = parsed.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      // Return same message as success to prevent email enumeration
      return NextResponse.json(
        { error: 'Un compte avec cet email existe déjà. Essayez de vous connecter.' },
        { status: 400 }
      );
    }

    // Generate unique slug with collision-safe retry
    let slug = toSlug(companyName);
    let attempt = 0;
    while (await prisma.organization.findUnique({ where: { slug } })) {
      slug = `${toSlug(companyName)}-${Date.now().toString(36).slice(-4)}`;
      if (++attempt > 5) break;
    }

    const hashedPassword = await hash(password, 12);

    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);

    const organization = await prisma.organization.create({
      data: {
        name: companyName,
        slug,
        subscription: {
          create: {
            plan: 'STARTER',
            status: 'TRIALING',
            maxEmployees: 25,
            stripeCurrentPeriodEnd: trialEnd,
          },
        },
        users: {
          create: {
            name,
            email,
            password: hashedPassword,
            role: 'ORG_ADMIN',
          },
        },
      },
    });

    return NextResponse.json({ success: true, organizationId: organization.id });
  } catch (error) {
    console.error('[REGISTER]', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue. Veuillez réessayer.' },
      { status: 500 }
    );
  }
}

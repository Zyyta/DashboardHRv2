import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';

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
    const { name, email, password, companyName } = await request.json();

    if (!name || !email || !password || !companyName) {
      return NextResponse.json(
        { error: 'Tous les champs sont obligatoires.' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères.' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Un compte avec cet email existe déjà.' },
        { status: 409 }
      );
    }

    // Generate unique slug
    let slug = toSlug(companyName);
    const existing = await prisma.organization.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
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

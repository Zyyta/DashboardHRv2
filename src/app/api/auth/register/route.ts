import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createAndSendOtp } from '@/lib/otp';
import { RegisterSchema, JoinOrgSchema } from '@/lib/validators';

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// POST /api/auth/register?flow=create  — create a new organization (ORG_ADMIN)
// POST /api/auth/register?flow=join    — join an existing org via invite code (ORG_MEMBER)
export async function POST(request: NextRequest) {
  const flow = request.nextUrl.searchParams.get('flow') ?? 'create';

  if (flow === 'join') {
    return handleJoin(request);
  }
  return handleCreate(request);
}

async function handleCreate(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { name, email, password, companyName } = parsed.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Un compte avec cet email existe déjà. Essayez de vous connecter.' },
        { status: 400 }
      );
    }

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
            maxDashboardUsers: 3,
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
      include: { users: { select: { id: true } } },
    });

    const userId = organization.users[0].id;
    await createAndSendOtp(userId, 'EMAIL_VERIFY', email);

    return NextResponse.json({ success: true, organizationId: organization.id });
  } catch (error) {
    console.error('[REGISTER/CREATE]', error);
    return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 });
  }
}

async function handleJoin(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = JoinOrgSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { name, email, password, inviteCode } = parsed.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Un compte avec cet email existe déjà. Essayez de vous connecter.' },
        { status: 400 }
      );
    }

    // Seat quota check + user creation in a transaction to prevent race conditions
    const hashedPassword = await hash(password, 12);

    try {
      const user = await prisma.$transaction(async (tx) => {
        const org = await tx.organization.findUnique({
          where: { inviteCode },
          include: {
            subscription: { select: { maxDashboardUsers: true } },
            _count: { select: { users: true } },
          },
        });

        if (!org) throw new Error('INVALID_CODE');

        const sub = org.subscription;
        if (sub && org._count.users >= sub.maxDashboardUsers) {
          throw new Error(`SEAT_QUOTA:${org._count.users}/${sub.maxDashboardUsers}`);
        }

        return tx.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            role: 'ORG_MEMBER',
            organizationId: org.id,
          },
          select: { id: true },
        });
      });

      await createAndSendOtp(user.id, 'EMAIL_VERIFY', email);
      return NextResponse.json({ success: true, userId: user.id });
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg === 'INVALID_CODE') {
        return NextResponse.json({ error: "Code d'invitation invalide." }, { status: 400 });
      }
      if (msg.startsWith('SEAT_QUOTA:')) {
        const parts = msg.replace('SEAT_QUOTA:', '').split('/');
        return NextResponse.json(
          { error: `Quota d'utilisateurs atteint (${parts[0]}/${parts[1]}). Contactez votre administrateur.` },
          { status: 400 }
        );
      }
      throw e;
    }
  } catch (error) {
    console.error('[REGISTER/JOIN]', error);
    return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 });
  }
}

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/dashboard/sidebar';
import { ThemeProvider } from '@/components/shared/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { CommandPalette } from '@/components/dashboard/command-palette';

// Paths always accessible regardless of subscription state.
// Admin and settings let users manage their org/account even after expiry.
const SUBSCRIPTION_EXEMPT = ['/dashboard/billing', '/dashboard/settings', '/admin'];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read pathname forwarded by middleware
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') ?? '';

  const session = await auth();
  const orgId = session?.user?.organizationId;
  const role = session?.user?.role;

  // SUPER_ADMIN has no subscription — skip the gate entirely
  if (orgId && role !== 'SUPER_ADMIN') {
    const sub = await prisma.subscription.findUnique({
      where: { organizationId: orgId },
      select: { status: true, stripeCurrentPeriodEnd: true },
    });

    if (sub) {
      // Auto-expire trial when the end date has passed
      const trialExpired =
        sub.status === 'TRIALING' &&
        sub.stripeCurrentPeriodEnd !== null &&
        sub.stripeCurrentPeriodEnd < new Date();

      if (trialExpired) {
        await prisma.subscription.update({
          where: { organizationId: orgId },
          data: { status: 'CANCELED' },
        });
      }

      const isExpired = trialExpired || sub.status === 'CANCELED';
      const isExempt = SUBSCRIPTION_EXEMPT.some((p) => pathname.startsWith(p));

      if (isExpired && !isExempt) {
        // ORG_MEMBER cannot access billing — redirect to settings so they can see the notice
        if (role === 'ORG_MEMBER') {
          redirect('/dashboard/settings');
        } else {
          redirect('/dashboard/billing');
        }
      }
    }
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
      <Toaster richColors position="top-right" />
      <CommandPalette />
    </ThemeProvider>
  );
}

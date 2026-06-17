// =============================================================================
// Root Layout — PeopleView HR Analytics Dashboard
// =============================================================================

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'PeopleView — Dashboard Analytique RH',
  description:
    'PeopleView centralise vos indicateurs RH en temps réel. Turnover, absentéisme, diversité, parité salariale — prenez des décisions éclairées.',
  keywords: ['RH', 'analytics', 'dashboard', 'turnover', 'absentéisme', 'SaaS', 'HR'],
  openGraph: {
    title: 'PeopleView — Dashboard Analytique RH',
    description:
      'Le tableau de bord RH qui transforme vos données en décisions.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}

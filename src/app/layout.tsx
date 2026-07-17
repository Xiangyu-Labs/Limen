import './globals.css';
import type { Metadata } from 'next';
import { AppToaster } from '@/components/AppToaster';

// A per-request CSP nonce requires Next.js to render scripts dynamically.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Limen',
  description: 'A personal diary app',
  robots: { index: false, follow: false, noarchive: true, nocache: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <html lang="zh"><body className="antialiased">{children}<AppToaster /></body></html>;
}

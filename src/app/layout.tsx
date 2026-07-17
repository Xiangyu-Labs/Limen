import './globals.css';
import type { Metadata } from 'next';
import { AppToaster } from '@/components/AppToaster';

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

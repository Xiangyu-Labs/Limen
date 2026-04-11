import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Limen',
  description: 'A personal diary app',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}

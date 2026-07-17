import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LogoutButton } from '@/components/LogoutButton';
import { messages } from '@/lib/messages';
import { dashboardPath, newEntryPath } from '@/lib/pathname';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { loginPath } from '@/lib/pathname';

export const maxDuration = 60;
export const preferredRegion = 'sin1';

export default async function DashboardLayout({
  children,
  navControls,
}: {
  children: React.ReactNode;
  navControls: React.ReactNode;
}) {
  if (!await getSession()) redirect(loginPath());
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="sticky top-0 z-10 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-3 md:px-6">
          <div className="flex items-center gap-3 overflow-x-auto whitespace-nowrap">
            <Link
              href={dashboardPath()}
              className="flex h-10 shrink-0 items-center font-semibold tracking-tight text-text transition-colors hover:text-primary"
            >
              <span>Limen</span>
            </Link>

            {navControls ? (
              <div className="min-w-[20rem] flex-1">{navControls}</div>
            ) : (
              <div className="min-w-0 flex-1" />
            )}

            <div className="flex shrink-0 items-center gap-2">
              <Button asChild size="sm" className="h-10 px-3 md:px-4">
                <Link href={newEntryPath()}>
                  <PlusCircle className="h-4 w-4" />
                  <span>{messages.common.new}</span>
                </Link>
              </Button>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8">{children}</div>
      </main>
    </div>
  );
}

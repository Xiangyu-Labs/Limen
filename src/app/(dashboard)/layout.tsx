import Link from 'next/link';
import { PlusCircle, LogOut } from 'lucide-react';
import { logout } from '@/lib/auth/actions';
import { Button } from '@/components/ui/button';
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
              <form action={logout}>
                <Button
                  variant="ghost"
                  size="sm"
                  type="submit"
                  className="h-10 w-10 p-0 text-muted hover:text-danger"
                  title={messages.common.logout}
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </form>
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

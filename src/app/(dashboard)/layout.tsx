import Link from 'next/link';
import { PlusCircle, LogOut, BookOpen } from 'lucide-react';
import { logout } from '@/lib/auth/actions';
import { SearchInput } from '@/components/SearchInput';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface2 flex flex-col">
      <header className="bg-surface border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 md:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <Link href="/" className="flex items-center gap-2 font-bold text-primary text-lg active:scale-[0.99] transition-transform">
                <BookOpen className="h-5 w-5" />
                <span className="tracking-tight">Limen</span>
              </Link>
              <p className="mt-1 hidden text-[10px] font-bold uppercase tracking-[0.24em] text-muted md:block">
                Capture • Refine • Revisit
              </p>
            </div>

            <div className="hidden flex-1 justify-center md:flex">
              <Suspense fallback={<div className="h-11 w-full max-w-md rounded-full bg-surface2 animate-pulse" />}>
                <SearchInput />
              </Suspense>
            </div>

            <div className="flex items-center gap-2">
              <Button asChild size="sm" className="h-10 rounded-full px-4">
                <Link href="/entries/new">
                  <PlusCircle className="h-4 w-4" />
                  <span>New</span>
                </Link>
              </Button>
              <form action={logout}>
                <Button
                  variant="ghost"
                  size="sm"
                  type="submit"
                  className="h-10 w-10 rounded-full p-0 text-muted hover:text-danger active:scale-[0.99]"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </form>
            </div>
          </div>

          <div className="mt-4 md:hidden">
            <Suspense fallback={<div className="h-11 w-full rounded-full bg-surface2 animate-pulse" />}>
              <SearchInput />
            </Suspense>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

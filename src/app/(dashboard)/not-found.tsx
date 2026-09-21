import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { messages } from '@/lib/messages';
import { dashboardPath } from '@/lib/pathname';

export default function DashboardNotFound() {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center text-center">
      <FileQuestion className="h-6 w-6 text-muted" />
      <p className="mt-3 text-sm text-muted">{messages.notFound.message}</p>
      <Link
        href={dashboardPath()}
        className="mt-5 inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium text-muted hover:bg-surface2 hover:text-text"
      >
        {messages.notFound.backToTimeline}
      </Link>
    </div>
  );
}

import Link from 'next/link';
import { messages } from '@/lib/messages';
import { dashboardPath } from '@/lib/pathname';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg p-6 text-center text-text">
      <p className="font-mono text-5xl font-semibold tracking-tight text-text">
        404
      </p>
      <p className="mt-3 text-sm text-muted">{messages.notFound.message}</p>
      <Link
        href={dashboardPath()}
        className="mt-6 inline-flex h-9 items-center justify-center rounded-md border border-border px-4 text-sm text-text hover:bg-surface2"
      >
        {messages.notFound.backToTimeline}
      </Link>
    </div>
  );
}

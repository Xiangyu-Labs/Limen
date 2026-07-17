import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EntryEditorForm } from '@/components/EntryEditorForm';
import { messages } from '@/lib/messages';
import { dashboardPath } from '@/lib/pathname';

export function getDefaultCreatedAtValue(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

export function isEntrySubmitDisabled({ loading, content }: { loading: boolean; content: string }) {
  return loading || !content.trim();
}

export default function NewEntryPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" asChild className="-ml-2">
          <Link href={dashboardPath()} aria-label={messages.common.timeline}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
      </div>
      <EntryEditorForm mode="create" initialCreatedAt={getDefaultCreatedAtValue()} />
    </div>
  );
}

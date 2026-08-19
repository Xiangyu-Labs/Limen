import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EntryEditorForm } from '@/components/EntryEditorForm';
import { messages } from '@/lib/messages';
import { dashboardPath } from '@/lib/pathname';
import { formatDateInTimeZone } from '@/lib/entry-date';
import { getSettings } from '@/lib/settings';

export function getDefaultCreatedAtValue(
  now = new Date(),
  timeZone = 'Asia/Shanghai',
) {
  return formatDateInTimeZone(now, timeZone);
}

export function isEntrySubmitDisabled({
  loading,
  content,
}: {
  loading: boolean;
  content: string;
}) {
  return loading || !content.trim();
}

export default async function NewEntryPage() {
  const settings = await getSettings();
  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" asChild className="-ml-2">
          <Link href={dashboardPath()} aria-label={messages.common.timeline}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
      </div>
      <EntryEditorForm
        mode="create"
        initialCreatedAt={getDefaultCreatedAtValue(
          new Date(),
          settings.timeZone,
        )}
        editorFontSize={settings.editorFontSize}
        timeZone={settings.timeZone}
      />
    </div>
  );
}

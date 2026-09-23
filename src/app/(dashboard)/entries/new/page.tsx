import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EntryEditorForm } from '@/components/EntryEditorForm';
import { messages } from '@/lib/messages';
import { dashboardPath } from '@/lib/pathname';
import { formatDateInTimeZone } from '@/lib/entry-date';
import { getSettings } from '@/lib/settings';

export const metadata: Metadata = { title: '新建' };

export function getDefaultCreatedAtValue(
  now = new Date(),
  timeZone = 'Asia/Shanghai',
) {
  return formatDateInTimeZone(now, timeZone);
}

export default async function NewEntryPage() {
  const settings = await getSettings();
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="-ml-3 text-muted hover:text-text"
        >
          <Link href={dashboardPath()} aria-label={messages.common.timeline}>
            <ArrowLeft className="h-4 w-4" />
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

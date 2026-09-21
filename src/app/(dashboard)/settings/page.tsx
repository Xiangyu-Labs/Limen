import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { listActiveTagNames } from '@/lib/db/entry-tags';
import { getSettings } from '@/lib/settings';
import { SettingsForm } from '@/components/SettingsForm';
import { messages } from '@/lib/messages';
import { loadWritingStats } from '@/lib/stats-data';
import { formatDateInTimeZone } from '@/lib/entry-date';

export const metadata: Metadata = { title: '设置' };

// Still used by the no-JavaScript fallback, which is redirected here.
const EXPORT_MESSAGES = messages.settings.exportFailed;

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ export?: string }>;
}) {
  const [settings, availableTags, stats, query] = await Promise.all([
    getSettings(),
    listActiveTagNames(db),
    loadWritingStats(
      db,
      formatDateInTimeZone(new Date(), (await getSettings()).timeZone),
    ),
    searchParams,
  ]);
  const exportMessage =
    EXPORT_MESSAGES[query.export as keyof typeof EXPORT_MESSAGES];

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">设置</h1>
      </div>
      {exportMessage ? (
        <p
          role="alert"
          className="border-l-2 border-warning bg-warning/10 px-4 py-3 text-sm"
        >
          {exportMessage}
        </p>
      ) : null}
      <SettingsForm
        settings={settings}
        availableTags={availableTags}
        stats={stats}
      />
    </div>
  );
}

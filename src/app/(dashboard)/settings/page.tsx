import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { entries } from '@/lib/db/schema';
import { parseStoredTags } from '@/lib/tags';
import { getSettings } from '@/lib/settings';
import { SettingsForm } from '@/components/SettingsForm';

export const metadata: Metadata = { title: '设置' };

const EXPORT_MESSAGES = {
  invalid: '导出条件无效，请检查日期和格式。',
  error: '导出失败，请稍后重试。',
  empty: '没有符合条件的记录。',
} as const;

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ export?: string }>;
}) {
  const [settings, tagRows, query] = await Promise.all([
    getSettings(),
    db.select({ tags: entries.tags }).from(entries),
    searchParams,
  ]);
  const availableTags = Array.from(
    new Set(tagRows.flatMap((row) => parseStoredTags(row.tags))),
  ).sort((a, b) => a.localeCompare(b, 'zh-CN'));
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
      <SettingsForm settings={settings} availableTags={availableTags} />
    </div>
  );
}

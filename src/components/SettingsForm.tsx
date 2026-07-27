'use client';

import { useActionState } from 'react';
import { Download, Save } from 'lucide-react';
import { saveSettings } from '@/lib/actions/settings';
import type { AppSettings } from '@/lib/settings-core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const TIME_ZONES = [
  'Asia/Shanghai',
  'Asia/Hong_Kong',
  'Asia/Taipei',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
  'UTC',
];

const GROUPS = {
  theme: [
    ['system', '跟随系统'],
    ['light', '浅色'],
    ['dark', '深色'],
  ],
  editorFontSize: [
    ['small', '小'],
    ['medium', '中'],
    ['large', '大'],
  ],
  defaultExportFormat: [
    ['markdown', 'Markdown'],
    ['json', 'JSON'],
  ],
  format: [
    ['markdown', 'Markdown'],
    ['json', 'JSON'],
  ],
} as const;

function SegmentedControl({
  name,
  value,
}: {
  name: keyof typeof GROUPS;
  value: string;
}) {
  return (
    <div className="inline-flex max-w-full rounded-md border border-border bg-surface p-1">
      {GROUPS[name].map(([option, label]) => (
        <label key={option} className="cursor-pointer">
          <input
            className="peer sr-only"
            type="radio"
            name={name}
            value={option}
            defaultChecked={option === value}
          />
          <span className="block rounded-sm px-3 py-1.5 text-sm text-muted transition-colors peer-checked:bg-surface2 peer-checked:font-medium peer-checked:text-text peer-focus-visible:ring-2 peer-focus-visible:ring-ring/40">
            {label}
          </span>
        </label>
      ))}
    </div>
  );
}

export function SettingsForm({
  settings,
  availableTags,
}: {
  settings: AppSettings;
  availableTags: string[];
}) {
  const [state, action, pending] = useActionState(saveSettings, undefined);
  return (
    <div className="space-y-10">
      <section aria-labelledby="appearance-heading" className="space-y-5">
        <div className="border-b border-border pb-3">
          <h2 id="appearance-heading" className="text-lg font-semibold">
            外观与编辑
          </h2>
        </div>
        <form action={action} className="space-y-6">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">主题</legend>
            <SegmentedControl name="theme" value={settings.theme} />
          </fieldset>
          <div className="max-w-md space-y-2">
            <label htmlFor="settings-time-zone" className="text-sm font-medium">
              时区
            </label>
            <Input
              id="settings-time-zone"
              name="timeZone"
              defaultValue={settings.timeZone}
              list="iana-time-zones"
              autoComplete="off"
              required
            />
            <datalist id="iana-time-zones">
              {TIME_ZONES.map((zone) => (
                <option key={zone} value={zone} />
              ))}
            </datalist>
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">编辑器字号</legend>
            <SegmentedControl
              name="editorFontSize"
              value={settings.editorFontSize}
            />
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">默认导出格式</legend>
            <SegmentedControl
              name="defaultExportFormat"
              value={settings.defaultExportFormat}
            />
          </fieldset>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={pending}>
              <Save />
              {pending ? '保存中' : '保存设置'}
            </Button>
            <p
              role={state && !state.ok ? 'alert' : 'status'}
              className={
                state && !state.ok
                  ? 'text-sm text-danger'
                  : 'text-sm text-muted'
              }
            >
              {state ? (state.ok ? '设置已保存' : state.error) : null}
            </p>
          </div>
        </form>
      </section>

      <section aria-labelledby="export-heading" className="space-y-5">
        <div className="border-b border-border pb-3">
          <h2 id="export-heading" className="text-lg font-semibold">
            数据导出
          </h2>
        </div>
        <form action="/api/export" method="get" className="space-y-6">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">格式</legend>
            <SegmentedControl
              name="format"
              value={settings.defaultExportFormat}
            />
          </fieldset>
          <div className="grid max-w-xl gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">
              <span>开始日期</span>
              <Input type="date" name="from" />
            </label>
            <label className="space-y-2 text-sm font-medium">
              <span>结束日期</span>
              <Input type="date" name="to" />
            </label>
          </div>
          {availableTags.length > 0 ? (
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium">标签（任一匹配）</legend>
              <div className="flex flex-wrap gap-x-5 gap-y-3">
                {availableTags.map((tag) => (
                  <label key={tag} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="tags"
                      value={tag}
                      className="size-4 accent-primary"
                    />
                    <span>{tag}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}
          <Button type="submit">
            <Download />
            下载导出文件
          </Button>
        </form>
      </section>
    </div>
  );
}

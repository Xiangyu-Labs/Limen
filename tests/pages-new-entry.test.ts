import test from 'node:test';
import assert from 'node:assert/strict';
import { isEntrySubmittable } from '@/lib/entry-editor';

test('a save in flight blocks another submit', () => {
  assert.equal(
    isEntrySubmittable({ content: 'hello', overLimit: false, pending: true }),
    false,
  );
});

test('blank content cannot be saved but real content can', () => {
  assert.equal(
    isEntrySubmittable({ content: '   ', overLimit: false, pending: false }),
    false,
  );
  assert.equal(
    isEntrySubmittable({ content: 'hello', overLimit: false, pending: false }),
    true,
  );
});

test('content past the limit cannot be saved', () => {
  assert.equal(
    isEntrySubmittable({ content: 'hello', overLimit: true, pending: false }),
    false,
  );
});

test('new entry shell announces the capture action', async () => {
  const { buildEntryEditorShellModel } =
    await import('@/components/EntryEditorShell');
  const model = buildEntryEditorShellModel({ mode: 'create' });
  assert.equal(model.title, '新建');
  assert.equal(model.primaryActionLabel, '保存');
});

test('the default entry date follows the saved time zone', async () => {
  const { getDefaultCreatedAtValue } =
    await import('@/app/(dashboard)/entries/new/page');
  assert.equal(
    getDefaultCreatedAtValue(new Date('2026-07-24T17:30:00Z'), 'Asia/Shanghai'),
    '2026-07-25',
  );
});

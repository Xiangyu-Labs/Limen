import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  CONTENT_WARNING_RATIO,
  describeContentLength,
} from '@/lib/entry-editor';
import { describeDraftStatus } from '@/lib/entry-draft';
import { isSaveShortcut } from '@/lib/keyboard';
import { messages } from '@/lib/messages';
import { ENTRY_CONTENT_MAX_LENGTH } from '@/lib/validation';

const MAX = ENTRY_CONTENT_MAX_LENGTH;

function shortcut(overrides: Partial<Parameters<typeof isSaveShortcut>[0]>) {
  return isSaveShortcut({
    key: 'Enter',
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    ...overrides,
  });
}

test('cmd or ctrl plus enter saves, other combinations do not', () => {
  assert.equal(shortcut({ metaKey: true }), true);
  assert.equal(shortcut({ ctrlKey: true }), true);
  assert.equal(shortcut({}), false);
  assert.equal(shortcut({ key: 'a', metaKey: true }), false);
  // Left alone so they stay available for other editor bindings.
  assert.equal(shortcut({ metaKey: true, shiftKey: true }), false);
  assert.equal(shortcut({ ctrlKey: true, altKey: true }), false);
});

test('the character counter escalates as it approaches the limit', () => {
  const plain = describeContentLength(10, messages.editor);
  assert.equal(plain.text, '10 字');
  assert.equal(plain.tone, 'muted');
  assert.equal(plain.overLimit, false);

  const near = describeContentLength(
    Math.ceil(MAX * CONTENT_WARNING_RATIO),
    messages.editor,
  );
  assert.equal(near.tone, 'warning');
  assert.equal(near.overLimit, false);

  const over = describeContentLength(MAX + 5, messages.editor);
  assert.equal(over.tone, 'danger');
  assert.equal(over.overLimit, true);
  assert.match(over.text, /超出 5 字/);
});

test('exactly at the limit is still saveable', () => {
  const exact = describeContentLength(MAX, messages.editor);
  assert.equal(exact.overLimit, false);
});

test('a long paste is kept rather than silently truncated', () => {
  // maxLength on the textarea would drop the overflow with no feedback at all.
  const source = readFileSync(
    new URL('../src/components/EntryEditorForm.tsx', import.meta.url),
    'utf8',
  );
  assert.doesNotMatch(source, /maxLength=/);
});

test('draft status tone comes from the state, not from the wording', () => {
  const at = (date: Date) => `${date.getUTCHours()}:00`;
  const copy = messages.editor;

  assert.deepEqual(describeDraftStatus({ kind: 'idle' }, copy, at), {
    text: undefined,
    tone: 'muted',
  });
  assert.deepEqual(describeDraftStatus({ kind: 'saving' }, copy, at), {
    text: '正在保存草稿',
    tone: 'muted',
  });
  assert.deepEqual(
    describeDraftStatus(
      { kind: 'saved', savedAt: new Date('2026-01-01T08:00:00Z') },
      copy,
      at,
    ),
    { text: '草稿已保存 8:00', tone: 'muted' },
  );

  for (const reason of ['save', 'discard', 'read'] as const) {
    const result = describeDraftStatus({ kind: 'error', reason }, copy, at);
    assert.equal(result.tone, 'danger', reason);
    assert.ok(result.text);
  }
});

test('draft error styling no longer depends on matching Chinese copy', () => {
  const source = readFileSync(
    new URL('../src/components/EntryEditorForm.tsx', import.meta.url),
    'utf8',
  );
  assert.doesNotMatch(source, /includes\('失败'\)|includes\('无法'\)/);
  assert.match(source, /visibleDraftStatus\.tone === 'danger'/);
});

test('the editor previews through the same renderer as the detail page', () => {
  const source = readFileSync(
    new URL('../src/components/EntryEditorForm.tsx', import.meta.url),
    'utf8',
  );
  assert.match(source, /MarkdownContent/);
  assert.match(source, /isSaveShortcut\(event\)/);
  // Hidden rather than unmounted, so the value is still submitted and the
  // browser keeps undo history.
  assert.match(source, /showPreview && 'hidden'/);
});

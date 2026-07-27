import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('dashboard exposes an accessible settings icon and applies the theme', () => {
  const source = readFileSync(
    new URL('../src/app/(dashboard)/layout.tsx', import.meta.url),
    'utf8',
  );
  assert.match(source, /settingsPath\(\)/);
  assert.match(source, /aria-label="设置"/);
  assert.match(source, /title="设置"/);
  assert.match(source, /data-theme=\{appSettings\.theme\}/);
});

test('settings form provides all settings, GET filters, and font sizes', () => {
  const source = readFileSync(
    new URL('../src/components/SettingsForm.tsx', import.meta.url),
    'utf8',
  );
  assert.match(source, /跟随系统/);
  assert.match(source, /Asia\/Shanghai/);
  assert.match(source, /editorFontSize/);
  assert.match(source, /defaultExportFormat/);
  assert.match(source, /action="\/api\/export"/);
  assert.match(source, /method="get"/);
  assert.match(source, /name="tags"/);

  const editor = readFileSync(
    new URL('../src/components/EntryEditorForm.tsx', import.meta.url),
    'utf8',
  );
  assert.match(editor, /editorFontSize === 'small'[\s\S]*'text-base'/);
  assert.match(editor, /editorFontSize === 'medium'[\s\S]*'text-lg'/);
  assert.match(editor, /editorFontSize === 'large'[\s\S]*'text-xl'/);
});

test('settings page maps all export redirect states to feedback', () => {
  const source = readFileSync(
    new URL('../src/app/(dashboard)/settings/page.tsx', import.meta.url),
    'utf8',
  );
  assert.match(source, /invalid:/);
  assert.match(source, /error:/);
  assert.match(source, /empty:/);
  assert.match(source, /role="alert"/);
});

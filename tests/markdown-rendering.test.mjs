import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

const pkg = JSON.parse(read('package.json'));

test('the typography plugin backing every prose class is installed and loaded', () => {
  // `prose` utilities silently emit nothing when the plugin is missing, which
  // is how entry bodies ended up with unstyled headings and bulletless lists.
  assert.ok(pkg.devDependencies['@tailwindcss/typography']);
  assert.match(
    read('src/app/globals.css'),
    /@plugin '@tailwindcss\/typography';/,
  );
});

test('markdown keeps single newlines and supports gfm', () => {
  assert.ok(pkg.dependencies['remark-breaks']);
  assert.ok(pkg.dependencies['remark-gfm']);
  const source = read('src/components/MarkdownContent.tsx');
  assert.match(source, /remarkBreaks/);
  assert.match(source, /remarkGfm/);
  assert.match(source, /remarkPlugins=\{REMARK_PLUGINS\}/);
});

test('raw html stays escaped in rendered entries', () => {
  assert.equal(pkg.dependencies['rehype-raw'], undefined);
  // react-markdown escapes raw HTML unless a rehype plugin re-enables it.
  assert.doesNotMatch(
    read('src/components/MarkdownContent.tsx'),
    /rehypePlugins|from 'rehype/,
  );
});

test('the entry detail page renders through the shared markdown component', () => {
  const source = read('src/app/(dashboard)/entries/[id]/page.tsx');
  assert.match(
    source,
    /<MarkdownContent>\{entry\.content\}<\/MarkdownContent>/,
  );
  // The old ad-hoc prose modifiers were dead classes; they must not come back.
  assert.doesNotMatch(source, /prose-headings:/);
  assert.doesNotMatch(source, /ReactMarkdown/);
});

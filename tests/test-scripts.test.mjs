import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const REQUIRED_SCRIPTS = [
  'dev',
  'build',
  'start',
  'test',
  'lint',
  'lint:fix',
  'typecheck',
  'format',
  'format:check',
  'check',
  'db:migrate',
  'db:generate',
  'auth:hash-password',
  'auth:generate-api-token',
];

test('package.json exposes all required scripts', () => {
  const pkg = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
  );

  for (const script of REQUIRED_SCRIPTS) {
    assert.ok(
      typeof pkg.scripts[script] === 'string',
      `Expected script "${script}" to be defined`,
    );
  }
});

test('package.json does not contain test:node', () => {
  const pkg = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
  );

  assert.equal(pkg.scripts['test:node'], undefined);
});

test('test command selects test files explicitly', () => {
  const pkg = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
  );

  const testScript = pkg.scripts.test;
  assert.ok(
    testScript.includes('tests/*.test.ts') || testScript.includes('--test'),
    'test command must reference test file patterns',
  );
});

test('check aggregate includes format:check, lint, typecheck, and test', () => {
  const pkg = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
  );

  const checkScript = pkg.scripts.check;
  assert.ok(checkScript.includes('format:check'));
  assert.ok(checkScript.includes('lint'));
  assert.ok(checkScript.includes('typecheck'));
  assert.ok(checkScript.includes('test'));
});

test('test command loads setup.ts bootstrap', () => {
  const pkg = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
  );

  assert.ok(pkg.scripts.test.includes('./tests/setup.ts'));
});

test('engines.node is 24.x', () => {
  const pkg = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
  );

  assert.equal(pkg.engines.node, '24.x');
});

test('package is private', () => {
  const pkg = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
  );

  assert.equal(pkg.private, true);
});

test('npm-publishing boilerplate is removed', () => {
  const pkg = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
  );

  assert.equal(pkg.main, undefined);
  assert.equal(pkg.description, undefined);
  assert.equal(pkg.directories, undefined);
  assert.equal(pkg.keywords, undefined);
  assert.equal(pkg.author, undefined);
});

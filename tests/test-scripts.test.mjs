import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const PKG = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
);

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
];

test('package.json exposes all required scripts', () => {
  for (const script of REQUIRED_SCRIPTS) {
    assert.ok(
      typeof PKG.scripts[script] === 'string',
      `Expected script "${script}" to be defined`,
    );
  }
});

test('plaintext auth does not expose credential generation scripts', () => {
  assert.equal(PKG.scripts['auth:hash-password'], undefined);
  assert.equal(PKG.scripts['auth:generate-api-token'], undefined);
});

test('package.json does not contain test:node', () => {
  assert.equal(PKG.scripts['test:node'], undefined);
});

test('test command selects test files explicitly', () => {
  const testScript = PKG.scripts.test;
  assert.ok(
    testScript.includes('tests/*.test.ts'),
    'test command must reference tests/*.test.ts pattern',
  );
  assert.ok(
    testScript.includes('tests/*.test.mjs'),
    'test command must reference tests/*.test.mjs pattern',
  );
});

test('check aggregate includes format:check, lint, typecheck, and test', () => {
  const checkScript = PKG.scripts.check;
  assert.ok(checkScript.includes('format:check'));
  assert.ok(checkScript.includes('lint'));
  assert.ok(checkScript.includes('typecheck'));
  assert.ok(checkScript.includes('test'));
});

test('test command loads setup.ts bootstrap', () => {
  assert.ok(PKG.scripts.test.includes('./tests/setup.ts'));
});

test('engines.node is 24.x', () => {
  assert.equal(PKG.engines.node, '24.x');
});

test('package is private', () => {
  assert.equal(PKG.private, true);
});

test('npm-publishing boilerplate is removed', () => {
  assert.equal(PKG.main, undefined);
  assert.equal(PKG.description, undefined);
  assert.equal(PKG.directories, undefined);
  assert.equal(PKG.keywords, undefined);
  assert.equal(PKG.author, undefined);
});

test('packageManager is pinned to exact version', () => {
  assert.equal(
    PKG.packageManager,
    'npm@11.17.0',
    `Expected packageManager to be "npm@11.17.0", got "${PKG.packageManager}"`,
  );
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { assembleSite, targetFor, previewSlug, branchForEvent } from './pages.mjs';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'penny-pages-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const site = join(root, 'site');
  const dist = join(root, 'dist');
  mkdirSync(dist);
  writeFileSync(join(dist, 'index.html'), 'production v1');
  const deploy = (branch, remove = false) =>
    assembleSite({ site, dist, branch, remove, repository: 'owner/holy-penny' });
  return { site, dist, deploy };
}

test('main and two previews survive independent updates; obsolete assets are removed', (t) => {
  const { site, dist, deploy } = fixture(t);
  writeFileSync(join(dist, 'old.js'), 'old');
  deploy('main');
  const a = targetFor('feature/a', 'owner/holy-penny').directory;
  const b = targetFor('codex/b', 'owner/holy-penny').directory;
  writeFileSync(join(dist, 'index.html'), 'preview A');
  deploy('feature/a');
  writeFileSync(join(dist, 'index.html'), 'preview B');
  deploy('codex/b');
  assert.equal(readFileSync(join(site, 'index.html'), 'utf8'), 'production v1');
  assert.equal(readFileSync(join(site, a, 'index.html'), 'utf8'), 'preview A');
  rmSync(join(dist, 'old.js'));
  writeFileSync(join(dist, 'index.html'), 'production v2');
  deploy('main');
  assert.equal(existsSync(join(site, 'old.js')), false);
  assert.equal(readFileSync(join(site, a, 'index.html'), 'utf8'), 'preview A');
  assert.equal(readFileSync(join(site, b, 'index.html'), 'utf8'), 'preview B');
  writeFileSync(join(dist, 'index.html'), 'preview A v2');
  deploy('feature/a');
  assert.equal(existsSync(join(site, a, 'old.js')), false);
  assert.equal(readFileSync(join(site, b, 'index.html'), 'utf8'), 'preview B');
  deploy('feature/a', true);
  deploy('feature/a', true);
  assert.equal(existsSync(join(site, a)), false);
  assert.equal(readFileSync(join(site, 'index.html'), 'utf8'), 'production v2');
  assert.equal(readFileSync(join(site, b, 'index.html'), 'utf8'), 'preview B');
});

test('first feature deploy cannot replace an existing live production site', (t) => {
  const { deploy } = fixture(t);
  assert.throws(() => deploy('feature/a'), /deploy main first/);
});

test('invalid build and production deletion leave stored production untouched', (t) => {
  const { site, dist, deploy } = fixture(t);
  deploy('main');
  rmSync(join(dist, 'index.html'));
  assert.throws(() => deploy('main'), /missing index/);
  assert.throws(() => deploy('main', true), /cannot be removed/);
  assert.equal(readFileSync(join(site, 'index.html'), 'utf8'), 'production v1');
});

test('branch names cannot collide through sanitization or escape preview paths', () => {
  assert.notEqual(previewSlug('feature/a-b'), previewSlug('feature/a/b'));
  assert.match(targetFor('feature/../../main', 'o/r').directory, /^preview\/[a-zA-Z0-9-]+$/);
  assert.throws(() => targetFor('pages-content', 'o/r'), /Unsupported/);
});

test('delete event uses the deleted branch rather than the default ref', () => {
  assert.equal(
    branchForEvent('delete', { ref: 'feature/a', ref_type: 'branch' }, 'main'),
    'feature/a'
  );
  assert.throws(
    () => branchForEvent('delete', { ref: 'feature/a', ref_type: 'tag' }, 'main'),
    /branch deletions/
  );
});

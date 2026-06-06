import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PROFILE, SECTION_IDS } from '../knowledge.js';

const html = readFileSync(
  fileURLToPath(new URL('../../index.html', import.meta.url)),
  'utf8'
);

test('every section id from knowledge exists in index.html', () => {
  for (const id of SECTION_IDS) {
    assert.ok(html.includes(`id="${id}"`), `missing section id="${id}"`);
  }
});

test('every project has a matching proj-<id> anchor in index.html', () => {
  assert.equal(PROFILE.projects.length, 10);
  for (const p of PROFILE.projects) {
    assert.ok(
      html.includes(`id="proj-${p.id}"`),
      `missing anchor id="proj-${p.id}" for ${p.title}`
    );
  }
});

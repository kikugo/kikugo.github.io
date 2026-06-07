import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TOOL_DECLARATIONS, dispatchTool } from '../tools.js';

test('declares the scrollToSection tool', () => {
  const names = TOOL_DECLARATIONS.map((d) => d.name);
  assert.ok(names.includes('scrollToSection'));
  assert.ok(names.includes('downloadCV'));
});

test('scrollToSection resolves a valid section id', () => {
  const r = dispatchTool('scrollToSection', { sectionId: 'projects' });
  assert.equal(r.action, 'scroll');
  assert.equal(r.domId, 'projects');
  assert.equal(r.ok, true);
});

test('scrollToSection maps a project id to its proj- DOM id', () => {
  const r = dispatchTool('scrollToSection', { sectionId: 'videosense' });
  assert.equal(r.domId, 'proj-videosense');
  assert.equal(r.ok, true);
});

test('scrollToSection rejects an unknown id without throwing', () => {
  const r = dispatchTool('scrollToSection', { sectionId: 'pricing' });
  assert.equal(r.ok, false);
});

test('downloadCV returns the cv action', () => {
  const r = dispatchTool('downloadCV', {});
  assert.equal(r.action, 'downloadCV');
  assert.equal(r.ok, true);
});

test('unknown tool returns ok:false', () => {
  const r = dispatchTool('launchRockets', {});
  assert.equal(r.ok, false);
});

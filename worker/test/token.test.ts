import { describe, it, expect } from 'vitest';
import { buildTokenConfig } from '../src/token';
import { MODEL, TOKEN_LIFETIME_MS } from '../src/config';
import { SYSTEM_PROMPT } from '../../assistant/knowledge.js';

describe('buildTokenConfig', () => {
  it('locks the token to the live model and audio modality', () => {
    const cfg = buildTokenConfig(new Date('2026-06-06T00:00:00Z'));
    expect(cfg.uses).toBe(1);
    expect(cfg.liveConnectConstraints.model).toBe(MODEL);
    expect(cfg.liveConnectConstraints.config.responseModalities).toEqual(['AUDIO']);
    expect(cfg.httpOptions.apiVersion).toBe('v1alpha');
  });

  it('expires the token, and so the session, after 5 minutes', () => {
    const now = new Date('2026-06-06T00:00:00Z');
    const cfg = buildTokenConfig(now);
    expect(TOKEN_LIFETIME_MS).toBe(5 * 60 * 1000);
    expect(new Date(cfg.expireTime).getTime() - now.getTime()).toBe(TOKEN_LIFETIME_MS);
    const start = new Date(cfg.newSessionExpireTime).getTime();
    expect(start).toBeGreaterThan(now.getTime());
    expect(start).toBeLessThanOrEqual(new Date(cfg.expireTime).getTime());
  });

  it('bakes in the pinned portfolio prompt and tools', () => {
    const c = buildTokenConfig().liveConnectConstraints.config as any;
    expect(c.systemInstruction.parts[0].text).toContain(SYSTEM_PROMPT);
    const names = c.tools[0].functionDeclarations.map((d: { name: string }) => d.name);
    expect(names.sort()).toEqual(['downloadCV', 'scrollToSection']);
    expect(c.outputAudioTranscription).toBeDefined();
    expect(c.inputAudioTranscription).toBeDefined();
  });

  it('does not enable session resumption, which would outlive the token', () => {
    const c = buildTokenConfig().liveConnectConstraints.config;
    expect(c.sessionResumption).toBeUndefined();
  });
});

import { describe, it, expect } from 'vitest';
import { buildTokenConfig } from '../src/token';
import { MODEL } from '../src/config';

describe('buildTokenConfig', () => {
  it('locks the token to the live model and audio modality', () => {
    const cfg = buildTokenConfig(new Date('2026-06-06T00:00:00Z'));
    expect(cfg.uses).toBe(1);
    expect(cfg.liveConnectConstraints.model).toBe(MODEL);
    expect(cfg.liveConnectConstraints.config.responseModalities).toContain('AUDIO');
    expect(cfg.httpOptions.apiVersion).toBe('v1alpha');
  });

  it('sets future expiry timestamps', () => {
    const now = new Date('2026-06-06T00:00:00Z');
    const cfg = buildTokenConfig(now);
    expect(new Date(cfg.expireTime).getTime()).toBeGreaterThan(now.getTime());
    expect(new Date(cfg.newSessionExpireTime).getTime()).toBeGreaterThan(now.getTime());
  });

  it('bakes the session config (systemInstruction + tools + transcription) into the locked config', () => {
    const cfg = buildTokenConfig(new Date(), {
      systemInstruction: { parts: [{ text: 'be a guide' }] },
      tools: [{ functionDeclarations: [] }],
    });
    const c = cfg.liveConnectConstraints.config;
    expect(c.systemInstruction).toEqual({ parts: [{ text: 'be a guide' }] });
    expect(c.tools).toEqual([{ functionDeclarations: [] }]);
    expect(c.outputAudioTranscription).toBeDefined();
    expect(c.inputAudioTranscription).toBeDefined();
  });

  it('omits systemInstruction and tools when none are provided', () => {
    const c = buildTokenConfig(new Date()).liveConnectConstraints.config;
    expect(c.systemInstruction).toBeUndefined();
    expect(c.tools).toBeUndefined();
  });
});

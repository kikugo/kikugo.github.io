import { describe, it, expect } from 'vitest';
import { isAllowedOrigin, corsHeaders } from '../src/cors';

const ALLOW = 'https://kikugo.github.io,http://localhost:8000';

describe('isAllowedOrigin', () => {
  it('accepts an allowlisted origin', () => {
    expect(isAllowedOrigin('https://kikugo.github.io', ALLOW)).toBe(true);
  });
  it('rejects an unknown origin', () => {
    expect(isAllowedOrigin('https://evil.example', ALLOW)).toBe(false);
  });
  it('rejects a missing origin', () => {
    expect(isAllowedOrigin(null, ALLOW)).toBe(false);
  });
});

describe('corsHeaders', () => {
  it('echoes an allowed origin', () => {
    const h = corsHeaders('https://kikugo.github.io', ALLOW);
    expect(h['Access-Control-Allow-Origin']).toBe('https://kikugo.github.io');
    expect(h['Vary']).toBe('Origin');
  });
  it('omits the allow-origin header for a disallowed origin', () => {
    const h = corsHeaders('https://evil.example', ALLOW);
    expect(h['Access-Control-Allow-Origin']).toBeUndefined();
  });
});

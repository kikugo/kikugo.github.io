import { GoogleGenAI } from '@google/genai';
import {
  MODEL,
  TOKEN_LIFETIME_MS,
  SESSION_START_WINDOW_MS,
} from './config';

export interface TokenConfig {
  uses: number;
  expireTime: string;
  newSessionExpireTime: string;
  liveConnectConstraints: {
    model: string;
    config: { responseModalities: string[] };
  };
  httpOptions: { apiVersion: string };
}

/** Pure: build the locked-down ephemeral-token config. */
export function buildTokenConfig(now: Date = new Date()): TokenConfig {
  return {
    uses: 1,
    expireTime: new Date(now.getTime() + TOKEN_LIFETIME_MS).toISOString(),
    newSessionExpireTime: new Date(
      now.getTime() + SESSION_START_WINDOW_MS
    ).toISOString(),
    liveConnectConstraints: {
      model: MODEL,
      config: { responseModalities: ['AUDIO'] },
    },
    httpOptions: { apiVersion: 'v1alpha' },
  };
}

export interface MintedToken {
  token: string;
  expiresAt: string;
}

/** Call Gemini to mint the ephemeral token. */
export async function mintToken(apiKey: string): Promise<MintedToken> {
  const ai = new GoogleGenAI({ apiKey });
  const cfg = buildTokenConfig();
  const created = await ai.authTokens.create({ config: cfg });
  return { token: created.name as string, expiresAt: cfg.expireTime };
}

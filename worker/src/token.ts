import { GoogleGenAI } from '@google/genai';
import {
  MODEL,
  TOKEN_LIFETIME_MS,
  SESSION_START_WINDOW_MS,
} from './config';
import { SYSTEM_INSTRUCTION, TOOLS } from './session';

export interface TokenConfig {
  uses: number;
  expireTime: string;
  newSessionExpireTime: string;
  liveConnectConstraints: {
    model: string;
    config: Record<string, unknown>;
  };
  httpOptions: { apiVersion: string };
}

/**
 * Pure: build the locked-down ephemeral-token config. The Live API applies the
 * token's locked config and ignores the client's, so the pinned system
 * instruction and tools here are what every session gets.
 */
export function buildTokenConfig(now: Date = new Date()): TokenConfig {
  return {
    uses: 1,
    expireTime: new Date(now.getTime() + TOKEN_LIFETIME_MS).toISOString(),
    newSessionExpireTime: new Date(
      now.getTime() + SESSION_START_WINDOW_MS
    ).toISOString(),
    liveConnectConstraints: {
      model: MODEL,
      config: {
        responseModalities: ['AUDIO'],
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: TOOLS,
      },
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
  const cfg = buildTokenConfig(new Date());
  const created = await ai.authTokens.create({ config: cfg });
  return { token: created.name as string, expiresAt: cfg.expireTime };
}

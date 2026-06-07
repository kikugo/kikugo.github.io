import { GoogleGenAI } from '@google/genai';
import {
  MODEL,
  TOKEN_LIFETIME_MS,
  SESSION_START_WINDOW_MS,
} from './config';

/**
 * Session config the client wants applied. The Live API applies the token's
 * locked config and ignores client-only fields, so systemInstruction/tools must
 * be baked into the token here for them to take effect.
 */
export interface SessionConfig {
  systemInstruction?: unknown;
  tools?: unknown;
}

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

/** Pure: build the locked-down ephemeral-token config, baking in the session config. */
export function buildTokenConfig(
  now: Date = new Date(),
  session: SessionConfig = {}
): TokenConfig {
  const config: Record<string, unknown> = {
    responseModalities: ['AUDIO'],
    inputAudioTranscription: {},
    outputAudioTranscription: {},
  };
  if (session.systemInstruction) config.systemInstruction = session.systemInstruction;
  if (session.tools) config.tools = session.tools;

  return {
    uses: 1,
    expireTime: new Date(now.getTime() + TOKEN_LIFETIME_MS).toISOString(),
    newSessionExpireTime: new Date(
      now.getTime() + SESSION_START_WINDOW_MS
    ).toISOString(),
    liveConnectConstraints: {
      model: MODEL,
      config,
    },
    httpOptions: { apiVersion: 'v1alpha' },
  };
}

export interface MintedToken {
  token: string;
  expiresAt: string;
}

/** Call Gemini to mint the ephemeral token with the session config baked in. */
export async function mintToken(
  apiKey: string,
  session: SessionConfig = {}
): Promise<MintedToken> {
  const ai = new GoogleGenAI({ apiKey });
  const cfg = buildTokenConfig(new Date(), session);
  const created = await ai.authTokens.create({ config: cfg });
  return { token: created.name as string, expiresAt: cfg.expireTime };
}

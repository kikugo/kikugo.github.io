export const MODEL = 'gemini-3.1-flash-live-preview';

// Token lifetimes
export const TOKEN_LIFETIME_MS = 30 * 60 * 1000; // 30 min total
export const SESSION_START_WINDOW_MS = 2 * 60 * 1000; // 2 min to start a session

// Rate limiting (per UTC day)
export const PER_IP_DAILY_LIMIT = 25;
export const GLOBAL_DAILY_LIMIT = 500;

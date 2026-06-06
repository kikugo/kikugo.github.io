// Re-export the SDK from the CDN so the rest of the widget imports locally.
// Keeping the CDN URL in one file makes version bumps and testing easy.
export { GoogleGenAI, Modality } from 'https://esm.run/@google/genai@1.29.0';

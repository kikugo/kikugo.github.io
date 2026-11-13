import { GoogleGenAI, Modality } from './sdk.js';
import { WORKER_URL, MODEL, INPUT_SAMPLE_RATE } from './config.js';
import { dispatchTool } from './tools.js';
import { floatTo16BitPCM, int16ToBase64, downsampleFloat32 } from './audio.js';
import { AudioPlayer } from './player.js';

/**
 * Owns one Live API conversation: token fetch, connect, mic streaming,
 * audio playback, transcription, and tool dispatch.
 *
 * Callbacks (all optional):
 *   onState(state)        'connecting'|'listening'|'thinking'|'speaking'|'idle'|'closed'
 *   onCaption(who, text)  who = 'user' | 'ai'
 *   onToolAction(action)  { action:'scroll', domId } | { action:'downloadCV' }
 *   onError(message)
 */
export class LiveSession {
  constructor(callbacks = {}) {
    this.cb = callbacks;
    this.session = null;
    this.player = new AudioPlayer();
    this.player.onStateChange = (s) => this._setState(s);
    this.micCtx = null;
    this.micStream = null;
    this.workletNode = null;
    this.closed = false;
    this._aiText = '';
    this._userText = '';
  }

  _setState(state) { this.cb.onState?.(state); }

  // The worker bakes the system prompt and tools into the token and ignores
  // anything the client sends, so the request carries no body. The Live API
  // applies the token's locked config over whatever we pass at connect.
  async _fetchToken() {
    const res = await fetch(WORKER_URL, { method: 'POST' });
    if (!res.ok) throw new Error(`token request failed: ${res.status}`);
    const { token } = await res.json();
    return token;
  }

  async connect() {
    this._setState('connecting');
    const token = await this._fetchToken();
    const ai = new GoogleGenAI({
      apiKey: token,
      httpOptions: { apiVersion: 'v1alpha' },
    });

    this.session = await ai.live.connect({
      model: MODEL,
      config: {
        responseModalities: [Modality.AUDIO],
        inputAudioTranscription: {},
        outputAudioTranscription: {},
      },
      callbacks: {
        onopen: () => this._setState('listening'),
        onmessage: (msg) => this._onMessage(msg),
        onerror: (e) => this.cb.onError?.(e.message || String(e)),
        onclose: () => { if (!this.closed) this._setState('idle'); },
      },
    });
  }

  _onMessage(msg) {
    const sc = msg.serverContent;
    if (sc?.interrupted) this.player.flush();

    const parts = sc?.modelTurn?.parts || [];
    for (const p of parts) {
      if (p.inlineData?.data) this.player.enqueue(p.inlineData.data);
    }
    // Transcriptions arrive in small incremental chunks; accumulate them into a
    // full sentence per turn instead of flashing one or two words at a time.
    if (sc?.outputTranscription?.text) {
      this._aiText += sc.outputTranscription.text;
      this.cb.onCaption?.('ai', this._aiText);
    }
    if (sc?.inputTranscription?.text) {
      this._userText += sc.inputTranscription.text;
      this.cb.onCaption?.('user', this._userText);
    }
    if (sc?.turnComplete) { this._aiText = ''; this._userText = ''; }

    if (msg.toolCall?.functionCalls?.length) {
      this._setState('thinking');
      const responses = [];
      for (const call of msg.toolCall.functionCalls) {
        const result = dispatchTool(call.name, call.args || {});
        if (result.ok && result.action) this.cb.onToolAction?.(result);
        responses.push({ id: call.id, name: call.name, response: { result: result.ok ? 'ok' : 'ignored' } });
      }
      this.session.sendToolResponse({ functionResponses: responses });
    }
  }

  /** Start streaming mic audio. Throws if mic permission is denied. */
  async startMic() {
    this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.micCtx = new (window.AudioContext || window.webkitAudioContext)();
    await this.micCtx.audioWorklet.addModule(new URL('./pcm-worklet.js', import.meta.url));

    const source = this.micCtx.createMediaStreamSource(this.micStream);
    this.workletNode = new AudioWorkletNode(this.micCtx, 'pcm-processor');
    const inRate = this.micCtx.sampleRate;

    this.workletNode.port.onmessage = (e) => {
      if (!this.session || this.closed) return;
      const down = downsampleFloat32(e.data, inRate, INPUT_SAMPLE_RATE);
      const b64 = int16ToBase64(floatTo16BitPCM(down));
      this.session.sendRealtimeInput({
        audio: { data: b64, mimeType: `audio/pcm;rate=${INPUT_SAMPLE_RATE}` },
      });
    };
    source.connect(this.workletNode);
    // Worklet has no audible output; do not connect to destination.
    this._setState('listening');
  }

  /** Text-mode input (no mic). */
  sendText(text) {
    if (!this.session) return;
    this._setState('thinking');
    this.session.sendClientContent({
      turns: [{ role: 'user', parts: [{ text }] }],
      turnComplete: true,
    });
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    try { this.workletNode?.port?.close(); } catch {}
    try { this.micStream?.getTracks().forEach((t) => t.stop()); } catch {}
    try { this.micCtx?.close(); } catch {}
    try { this.session?.close(); } catch {}
    this.player.close();
    this._setState('closed');
  }
}

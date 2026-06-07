import { base64ToFloat32 } from './audio.js';
import { OUTPUT_SAMPLE_RATE } from './config.js';

/** Schedules base64 PCM16 chunks for gapless playback; flush() enables barge-in. */
export class AudioPlayer {
  constructor() {
    this.ctx = null;
    this.nextStartTime = 0;
    this.sources = new Set();
    this.onStateChange = () => {};
  }

  ensureContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: OUTPUT_SAMPLE_RATE,
      });
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  enqueue(base64Pcm) {
    this.ensureContext();
    const float = base64ToFloat32(base64Pcm);
    if (!float.length) return;

    const buffer = this.ctx.createBuffer(1, float.length, OUTPUT_SAMPLE_RATE);
    buffer.getChannelData(0).set(float);

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(this.ctx.destination);

    const now = this.ctx.currentTime;
    const startAt = Math.max(now, this.nextStartTime);
    src.start(startAt);
    this.nextStartTime = startAt + buffer.duration;

    this.sources.add(src);
    this.onStateChange('speaking');
    src.onended = () => {
      this.sources.delete(src);
      if (this.sources.size === 0) this.onStateChange('idle');
    };
  }

  /** Stop all queued audio immediately (called on interruption / end). */
  flush() {
    for (const src of this.sources) {
      try { src.stop(); } catch { /* already stopped */ }
    }
    this.sources.clear();
    this.nextStartTime = this.ctx ? this.ctx.currentTime : 0;
    this.onStateChange('idle');
  }

  close() {
    this.flush();
    if (this.ctx) { this.ctx.close(); this.ctx = null; }
  }
}

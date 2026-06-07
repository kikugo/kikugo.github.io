const STATUS = {
  connecting: 'connecting...', listening: 'listening', thinking: 'thinking...',
  speaking: 'speaking', idle: 'tap the mic or type', closed: '',
};

/** Builds and controls the concierge DOM. Pure view layer; emits events via handlers. */
export class ConciergeUI {
  constructor(handlers = {}) {
    this.h = handlers;
    this._build();
  }

  _build() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'concierge-overlay';
    this.overlay.innerHTML = `
      <div class="concierge-panel" data-state="idle" role="dialog" aria-label="AI portfolio guide">
        <div class="concierge-orb"></div>
        <div class="concierge-status"></div>
        <div class="concierge-caption"></div>
        <div class="concierge-controls">
          <button class="mic" type="button">🎙 start</button>
          <button class="end" type="button">end</button>
        </div>
        <div class="concierge-textbar">
          <input type="text" maxlength="600" placeholder="or type a question..." aria-label="Type a question" />
          <button class="send" type="button">send</button>
        </div>
      </div>`;
    document.body.appendChild(this.overlay);

    this.panel = this.overlay.querySelector('.concierge-panel');
    this.statusEl = this.overlay.querySelector('.concierge-status');
    this.captionEl = this.overlay.querySelector('.concierge-caption');
    this.micBtn = this.overlay.querySelector('.mic');
    this.input = this.overlay.querySelector('input');

    this.micBtn.onclick = () => this.h.onMic?.();
    this.overlay.querySelector('.end').onclick = () => this.h.onEnd?.();
    const send = () => {
      const v = this.input.value.trim().slice(0, 600); // cap payload length
      if (v) { this.h.onText?.(v); this.input.value = ''; }
    };
    this.overlay.querySelector('.send').onclick = send;
    this.input.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.h.onEnd?.();
    });
  }

  open() { this.overlay.dataset.open = 'true'; }
  close() { this.overlay.dataset.open = 'false'; }
  setState(state) {
    this.panel.dataset.state = state;
    this.statusEl.textContent = STATUS[state] ?? '';
  }
  setCaption(who, text) {
    this.captionEl.textContent = text;
    this.captionEl.style.color = who === 'user' ? 'var(--muted,#a3a3a3)' : 'var(--text,#fafafa)';
  }
  setMicMode(active) { this.micBtn.textContent = active ? '🎙 listening' : '🎙 start'; }
}

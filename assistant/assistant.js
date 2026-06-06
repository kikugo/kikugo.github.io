import { ConciergeUI } from './ui.js';
import { LiveSession } from './session.js';
import { PROFILE } from './knowledge.js';
import { MAX_SESSION_MS } from './config.js';

function supported() {
  return (
    typeof WebSocket !== 'undefined' &&
    (window.AudioContext || window.webkitAudioContext) &&
    typeof navigator !== 'undefined'
  );
}

function highlight(domId) {
  const el = document.getElementById(domId);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.add('concierge-highlight');
  setTimeout(() => el.classList.remove('concierge-highlight'), 2200);
}

function init() {
  if (!supported()) return; // leave the static site untouched

  let session = null;
  let sessionTimer = null;

  const ui = new ConciergeUI({
    onMic: () => startMic(),
    onText: (t) => session?.sendText(t),
    onEnd: () => end(),
  });

  async function start() {
    ui.open();
    ui.setState('connecting');
    session = new LiveSession({
      onState: (s) => ui.setState(s),
      onCaption: (who, text) => ui.setCaption(who, text),
      onToolAction: (a) => {
        if (a.action === 'scroll') highlight(a.domId);
        if (a.action === 'downloadCV') window.open(PROFILE.cvUrl, '_blank');
      },
      onError: (m) => ui.setCaption('ai', 'sorry, something went wrong: ' + m),
    });
    try {
      await session.connect();
      sessionTimer = setTimeout(() => end(), MAX_SESSION_MS);
    } catch (e) {
      ui.setCaption('ai', 'could not connect right now. try again later.');
    }
  }

  async function startMic() {
    try {
      await session.startMic();
      ui.setMicMode(true);
    } catch {
      ui.setCaption('ai', "mic is blocked — you can still type your question below.");
      ui.setMicMode(false);
    }
  }

  function end() {
    clearTimeout(sessionTimer);
    session?.close();
    session = null;
    ui.setMicMode(false);
    ui.close();
  }

  // Trigger: use an existing dock button if present, else inject a floating one.
  const existing = document.getElementById('concierge-trigger');
  if (existing) {
    existing.addEventListener('click', start);
  } else {
    const btn = document.createElement('button');
    btn.className = 'concierge-trigger';
    btn.style.cssText = 'position:fixed;bottom:1.25rem;right:1.25rem;z-index:55;';
    btn.textContent = '🤖 talk to my portfolio';
    btn.onclick = start;
    document.body.appendChild(btn);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

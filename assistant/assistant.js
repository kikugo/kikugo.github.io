// Only the small trigger wiring loads with the page. The UI, the session and the
// Gemini SDK behind it are fetched on first open.

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
  let ui = null;
  let mods = null;
  let returnFocus = null;

  async function load() {
    if (!mods) {
      const [{ ConciergeUI }, { LiveSession }, { PROFILE }, { MAX_SESSION_MS }] = await Promise.all([
        import('./ui.js'), import('./session.js'), import('./knowledge.js'), import('./config.js'),
      ]);
      mods = { LiveSession, PROFILE, MAX_SESSION_MS };
      ui = new ConciergeUI({
        onMic: () => startMic(),
        onText: (t) => session?.sendText(t),
        onEnd: () => end(),
      });
    }
    return mods;
  }

  async function start(e) {
    if (session) return;
    returnFocus = e?.currentTarget ?? document.activeElement;
    let m;
    try {
      m = await load();
    } catch {
      return; // network hiccup loading the widget; the static page still works
    }
    if (session) return;
    ui.open();
    ui.setState('connecting');
    session = new m.LiveSession({
      onState: (s) => ui.setState(s),
      onCaption: (who, text) => ui.setCaption(who, text),
      onToolAction: (a) => {
        if (a.action === 'scroll') highlight(a.domId);
        if (a.action === 'downloadCV') window.open(m.PROFILE.cvUrl, '_blank');
      },
      onError: (msg) => ui.setCaption('ai', 'sorry, something went wrong: ' + msg),
    });
    try {
      await session.connect();
      sessionTimer = setTimeout(() => end(), m.MAX_SESSION_MS);
    } catch (err) {
      session?.close();
      session = null;
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
    if (!ui) return;
    ui.setMicMode(false);
    ui.close();
    if (returnFocus && typeof returnFocus.focus === 'function') returnFocus.focus();
    returnFocus = null;
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && ui?.isOpen()) end();
  });

  // Triggers: wire every element marked data-concierge; if none, inject a floating one.
  const triggers = document.querySelectorAll('[data-concierge]');
  if (triggers.length) {
    triggers.forEach((t) => t.addEventListener('click', start));
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

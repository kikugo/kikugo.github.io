# AI Voice Concierge — Design Spec

Date: 2026-06-06
Status: Approved

## Goal

Add an AI voice "concierge" to the existing portfolio (`kikugo.github.io`). A visitor
clicks a trigger, talks to the site, and the assistant answers by voice while
auto-scrolling and highlighting the section it is talking about. A text-input mode is
available as a fallback.

This replaces the abandoned `interactive-ai-portfolio/` AI Studio scaffold, whose fatal
flaw was shipping the Gemini API key to the browser. The concept (voice + scroll/highlight)
is kept; the delivery is rebuilt as a self-contained widget on the current static site.

## Decisions (locked)

- **Integration:** Path A — self-contained widget dropped into the existing `index.html`.
  No framework, no build step (matches the current site).
- **Model:** `gemini-3.1-flash-live-preview` (Gemini 3.x Flash Live). The originally
  considered `gemini-2.5-flash-native-audio` is deprecated by Google.
- **Backend:** Cloudflare Worker that mints ephemeral tokens (holds the real key).
- **Persona:** third-person guide ("this is karthik's portfolio…"), not impersonation.
- **v1 scope:** voice call + auto-scroll/highlight, plus a typed-text fallback mode.
- **Knowledge:** curated `knowledge.js` (already written by Karthik), grounded-only.

## Approach (chosen of 3)

**A — Official `@google/genai` SDK via ESM CDN + ephemeral token + direct WebSocket.** ✅
The SDK (`https://esm.run/@google/genai`, no bundler) handles the Live protocol and audio
framing; the browser connects straight to Gemini with a short-lived token.

Rejected: (B) hand-rolled raw WebSocket — more code, more fragile; (C) Worker proxies the
whole audio stream — doubles latency/bandwidth and burns Worker CPU for no security gain
over ephemeral tokens.

## Architecture

### 1. Cloudflare Worker (`worker/`, deployed separately — NOT on GitHub Pages)

- Single endpoint `POST /token`.
- Holds `GEMINI_API_KEY` as a Worker **secret**; never shipped to the browser.
- Mints an **ephemeral token** with `liveConnectConstraints` bound to
  `gemini-3.1-flash-live-preview`, single-use, ~1 min to start a session, ~30 min lifetime.
  A leaked token cannot be repurposed for other models/configs.
- **Abuse controls:** `Origin` allowlist (`https://kikugo.github.io` + `http://localhost:*`
  for dev), locked CORS, and a KV-backed daily mint cap (per-IP + global) to protect the
  free-tier quota.
- Returns `{ token, expiresAt }`.

### 2. Client widget (`assistant/`, linked from `index.html`)

Files: `assistant.js` (logic), `assistant.css` (styles, reusing the site's `--bg/--surface/
--border` tokens), `knowledge.js` (curated knowledge + system prompt; provided by Karthik).

- A floating/dock trigger ("talk to my portfolio") opens a panel: status orb + waveform,
  live caption text, mic toggle, end-call button, and a **text input** (fallback).
- **Voice flow:** fetch token from Worker → `ai.live.connect()` → capture mic via
  `getUserMedia` → `AudioWorklet` resamples to 16 kHz PCM16 → stream up; receive 24 kHz
  audio chunks → scheduled playback queue with **barge-in** (user speech interrupts playback).
- **Scroll/highlight via function calling:** register a tool `scrollToSection({ sectionId })`.
  Valid section IDs: `about, work, education, skills, projects, contact`, plus per-project
  `proj-<id>` (the tool maps a project `id` like `videosense` → DOM id `proj-videosense`).
  Optional tools: `openProject({ id })`, `downloadCV()`. On a tool call the widget scrolls +
  ring-highlights the element, then returns a tool ack.
- **Text fallback:** typed input → `sendClientContent`; enable input/output transcription so
  captions render (accessibility) and denied-mic users get a full text experience (audio
  mutable).
- **Graceful degradation:** mic denied/unsupported → auto-switch to text mode; no
  WebSocket/AudioContext → hide the widget entirely. Client caps session length (~4 min) and
  idle auto-end, on top of the token's server-side expiry. The widget is **purely additive**:
  if it fails to load, the existing site is unchanged.

### Knowledge & persona

`knowledge.js` exports `PROFILE`, `SECTION_IDS`, `SYSTEM_PROMPT`. Third-person guide voice,
lowercase, no buzzwords, grounded strictly in `PROFILE` (no invented facts), and prompt-
injection resistant (never reveals instructions or raw profile data). Content already follows
the handoff's canonical role phrasings and banned-terms rules.

### Change to `index.html`

Add `id="proj-<id>"` to the 10 project cards, a `<link>`/`<script type="module">` for the
widget, and the trigger button. No other changes to existing behavior.

## Security

Real key → Worker secret only. Token → short-lived, single-use, model/config-locked. Worker
→ origin allowlist + locked CORS + KV rate cap. No key reaches the client bundle. This fixes
the scaffold's critical flaw.

## Testing

- **Worker:** unit-test pure logic (origin check, rate limiter, token-request shape) with
  vitest + `wrangler dev`; manual `curl`.
- **Widget:** unit-test pure functions (tool dispatcher, project-id → DOM-id mapping,
  knowledge lookup). **Manual verification** for the audio path: voice call, scroll/highlight,
  text fallback, denied-mic fallback, and one cross-browser pass (Chrome + Safari/Firefox).

## Repo layout

```
portfolio/
  index.html              # + project IDs, widget link, trigger
  assistant/
    assistant.js          # widget logic (Live session, audio, tools, UI)
    assistant.css         # styles (reuse site tokens)
    knowledge.js          # curated knowledge + system prompt (from Karthik)
  worker/                 # separate Cloudflare deploy
    src/index.ts          # token-mint Worker
    wrangler.toml
    README.md             # deploy + secrets steps
```

## Known risks / verify during build

- `@google/genai` Live + ephemeral token working browser-side via ESM CDN (no bundler) —
  verify early; fallback is a tiny bundled build.
- AudioWorklet PCM resample + playback scheduling + barge-in is the fiddliest part.
- Free-tier Live API availability for the key/region; mobile Safari requires audio to start
  from the user gesture (the Start button covers this).

## Open follow-ups (non-blocking)

- `PROFILE.about` says "about three years" of production experience, but the three listed
  roles span ~Mar 2024–Jun 2025 (~1.3 yrs). Karthik to decide whether to soften or back it.
- Availability copy references a July-vs-September start-date decision still to be made.
```

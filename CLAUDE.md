# CLAUDE.md — Rosary Yoga

A personal PWA that couples the rosary with a morning Sun Salutation practice
(plus a restorative floor practice for hurt days). Vanilla ES modules, no
framework, no build step. Static-hostable; offline-first via service worker.

## Intent

- **One decision per day**: "did I do the rosary." The app removes every other choice.
- **The app is scaffolding**: the long-term goal is running the practice from
  memory, phone away. Teaching surfaces (pose cues, notes, TTS) exist to make
  themselves unnecessary.
- **No streaks, ever**: the completion counter is a lifetime total. Nothing in
  this app may shame a missed day.
- **Safety defaults for solo practice**: Plank and Low Cobra stand in for
  Chaturanga/Up Dog. The body check (Easy/Tender/Hurt) softens or reroutes the
  practice; sharp pain never meets a salutation.

## Structure

```
practice.md          The manual — the human-readable source of truth
README.md            Identity, install, hosting, customization pointers
app/
  index.html         Shell: card stage, overlays (menu/body/mystery/voice/help)
  app.js             App entry: state, rendering, voice (TTS + "amen" SR),
                     gestures, menus, persistence
  sequence.js        Bead structure (74 beads) + sequence interpreter
  style.css          Design system (burgundy/cream/gold on near-black)
  sw.js              Offline cache — CACHE_NAME + explicit ASSETS list
  manifest.webmanifest
  data/practice.json The practice itself — prayers, poses, sequences,
                     mysteries, body states
  assets/poses/      Line-art SVGs (inline-rendered, currentColor)
  assets/poses/photos/  Photos shown in place of SVGs (floor practice + any
                     standing pose with a "photo" field)
art/masters/         Full-resolution originals of generated pose photography;
                     app copies are downscaled (~800px, jpeg q62) into
                     app/assets/poses/photos/
docs/archive/        Historical PDFs; inactive
.claude/launch.json  Dev server config (python3 http.server on 8765)
```

## Domains

| Domain | Where | Notes |
|--------|-------|-------|
| Practice data | `data/practice.json` | Version field; `sequences` block defines each practice |
| Sequence interpretation | `sequence.js` | Pure: data → flat station list; bead math lives here only |
| Rendering | `app.js` (render, updateCues, rosary strip) | One card per station; inline SVG art via preloaded map |
| Voice | `app.js` (TTS cues, SpeechRecognition amen/commands) | Interim-transcript amen counting; cue-equality suppression |
| Persistence | `app.js` (localStorage) | Session resume (1h TTL), practice choice, body state (per-day), cues-open, completions |
| Offline | `sw.js` | Cache-first, same-origin only |

## Contracts — keep these in sync

1. **practice.json ↔ practice.md**: any change to poses, sequences, or notes
   in one must be reflected in the other. The manual and the data must tell
   the same story.
2. **practice.json poses ↔ assets/poses/**: every pose needs `image` (SVG) or
   `photo`. New SVGs follow the art language below.
3. **Any app-file change → bump `CACHE_NAME` in sw.js** and add new files to
   `ASSETS`. Installed PWAs serve stale cache otherwise (this bites in dev
   too — unregister the SW or bump the version when testing).
4. **README "Using it" ↔ actual UI**: the README describes buttons and
   gestures; if a UI element is added/removed, update it. Doc drift here is a
   teaching failure, not a nit.
5. **Sequence schema** (interpreter expects): `sequences.<key>` with
   `opening[]`, `decade_templates{}`, `decades[5]` (template names or inline),
   `closing[]`, optional `body_states.{tender,hurt}` overrides
   (`decades` replacement or `switch_to` another sequence — one hop, no
   chains). Station defs: `kind` (prayer/interlude), `pose`, `prayer`,
   optional `count`, `note`, `label`, `title`/`body`/`final` for interludes.
   `hail_marys` is an array of 10 (string or `{pose, note}`) or a single pose
   id for all ten, with optional `hail_mary_notes` keyed `"1"`–`"10"`.

## Pose art language

- viewBox `0 0 320 200`; figure strokes `currentColor`, width 5, round caps —
  inherits the app's burgundy via `.pose-figure` color.
- Heads: filled circles, r 10–11. Ground line: currentColor, width 2.5,
  opacity 0.18.
- Motion/breath hints only where they teach (arrows, plumb line):
  `var(--gold, #c8a45a)`, width 2.5.
- Composite cards (half salutation, vinyasa) are triptychs of 0.55-scale
  minis with gold arrows between.
- Every SVG: `role="img"` + `<title>`.

## Conventions

- Vanilla JS, ES modules, no dependencies. Match the existing comment voice —
  comments explain *why* and document platform quirks (iOS Safari SR/TTS
  behavior especially).
- Copy is part of the product. Prayer texts carry `↑`/`↓`/`✦` breath markers.
  App copy says "today"/"this morning", never "tonight" (except restorative
  interlude bodies, which are time-neutral).
- Advance is voice ("amen") or touch only. There are no timers; do not
  reintroduce auto-advance.
- localStorage keys are namespaced `rosary-yoga.*`. The completion counter is
  `{count, lastDate}` — lastDate exists only to prevent double-counting a day.

## Testing

No test framework. Verify in the browser: `.claude/launch.json` runs
`python3 -m http.server 8765` from `app/`. Walk: body check → pendant →
decade 1 (per-bead poses, notes lead the prayer) → mystery card → decade 4
(vinyasa/warrior beads) → final card (practice count) → menu practice toggle →
body states (Tender = all-A decades; Hurt = floor practice). Remember the
service worker: unregister or bump CACHE_NAME between test rounds.

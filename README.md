# Rosary Yoga

A morning anchor for body, mind, and the day ahead.

Five Sun Salutations. Five mysteries. Thirty minutes at the start of the day. The body learns the cue. The mind follows the bead.

---

## What's in this repo

- **[practice.md](practice.md)** — the manual. The full salutation practice bead by bead, every pose with setup and hold cues, the floor practice for hurt days, and external references. Read this first.
- **[app/](app/)** — a small Progressive Web App that walks you through the practice bead by bead. Install once, run offline forever.
- **[CLAUDE.md](CLAUDE.md)** — project structure, domains, and the contracts that keep data, docs, and cache in sync.
- **[docs/archive/](docs/archive/)** — the original PDFs and source text. Historical reference; the active source of truth is `practice.md`.

---

## The two practices

The app ships two practices on the same beads:

- **Morning Salutations** *(default)* — Sun Salutation A (decades 1–3) and B (decades 4–5), one pose per Hail Mary bead, standing and breath-led. The pendant is the warmup: arm floats, three half salutations, a standing crescent.
- **Restorative Floor** — the original sequence of long passive holds. Where **Hurt** days go automatically; also right for hard evenings and travel.

Switch anytime from the menu (**⋮ → Practice**). The daily body check (Easy / Tender / Hurt) softens or reroutes the practice without you having to decide anything else.

---

## Using the app on iPhone

The app is a Progressive Web App, not a native app. It installs to your home screen and runs fullscreen — no App Store step, no developer account.

### Install

1. Host the `app/` folder somewhere (see *Hosting* below).
2. On your iPhone, open Safari and navigate to the hosted URL.
3. Tap the **Share** button (the square with the up-arrow).
4. Scroll down and tap **Add to Home Screen**.
5. Name it "Rosary Yoga" and tap Add.

After the first launch the app is cached for offline use, so it works on planes, in hotels, anywhere.

### Using it

- **Hands-free mode** (menu → Hands-free mode) is the way to practice the salutations — you cannot swipe a phone from Plank. The app speaks each pose as its bead arrives ("Plank. Hail Mary.") and your spoken **"amen"** advances the bead. Prop the phone at the front of the mat.
- **Tap right / swipe left** to advance manually; **tap left / swipe right** to go back. **Tap any bead** on the strip to jump.
- **Show pose cues** at the bottom of any card unfolds the pose's setup and hold instructions. It stays open across cards and sessions — keep it open while learning, close it when the sequence lives in your body.
- Transition notes ("Step back.", "Switch sides.") appear above the prayer text and are spoken first in hands-free mode.
- The **⋮ menu**: hands-free toggle, voice settings, restart, switch practice, change today's mysteries, redo the body check.
- The app remembers where you were for up to an hour. The final card shows your lifetime practice count — a total, never a streak.

### What it shows you when you open it

First, the body check: **How is your body today?** Easy runs the full practice; Tender keeps all five decades on Salutation A; Hurt hands the day to the floor practice.

Today's mysteries are picked from the day of the week — Monday and Saturday are Joyful, Tuesday and Friday are Sorrowful, Wednesday and Sunday are Glorious, Thursday is Luminous. Override from the menu if you want a different set.

---

## Hosting

The app is static HTML, CSS, and JS. No build step. Any static host works.

### GitHub Pages (easiest)

1. Push this repo to GitHub.
2. In the repo settings, enable Pages from the `main` branch, root directory.
3. The app will be at `https://<your-username>.github.io/rosary-yoga/app/`.
4. Open that URL on your iPhone and follow the install steps above.

### Local testing

```sh
cd app
python3 -m http.server 8765
```

Then open `http://localhost:8765`. The PWA install prompt only appears over HTTPS, so for actual install you need a real host — but the practice works fine locally for testing. Note the service worker caches aggressively: after changing files, bump `CACHE_NAME` in `app/sw.js` or unregister the worker in devtools.

### Any other static host

Netlify, Vercel, Cloudflare Pages, S3 — all work. Point them at the `app/` directory.

---

## Customizing the practice

The practice is data-driven — including the sequence itself. Everything lives in [`app/data/practice.json`](app/data/practice.json):

- **Prayers, poses, mysteries** — text, names, setup/hold cues.
- **`sequences`** — the practices. Each defines its `opening` cards, five `decades` (via reusable `decade_templates`: an Our Father pose, ten Hail Mary poses with optional per-bead notes, a Glory Be pose), `closing` cards, and per-body-state overrides (`tender` swaps decade templates; `hurt` can `switch_to` another sequence).
- **`default_sequence`** — which practice the app opens into.

Pose illustrations are line-art SVGs in `app/assets/poses/` — they render inline and inherit the app palette via `currentColor`. Poses with a `photo` field use the photo instead.

After any change: increment `CACHE_NAME` in `app/sw.js` so installed apps pick it up, and keep `practice.md` in sync — the manual and the data must tell the same story (see [CLAUDE.md](CLAUDE.md) for the full contract list).

---

## Why this exists

The body needs daily movement. The mind needs daily stillness. Doing them separately is two decisions; coupling them is one. The rosary provides the structure, the salutations provide the substance, and the practice happens whether you wanted to do it this morning or not — because the only question is "did I do the rosary."

Sun Salutations are named for sunrise, and morning prayer is as old as the faith. This is the practice that starts the day gathered instead of scattered — warm body, quiet mind, intention set — and leaves the evening free for rest.

The goal is not perfection in any single session. The goal is to still be doing this in thirty years.

---

## License

Personal use. No license set.
